import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user and their role
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    });

    if (!user) {
      // Deliberately return standard generic error
      return NextResponse.json(
        { error: "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    // 2. Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed login history
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          status: "FAILED",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Unknown",
        },
      });

      return NextResponse.json(
        { error: "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    // 3. Check if user is blocked
    if (user.isBlocked) {
      // Log blocked login attempt
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          status: "BLOCKED",
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          userAgent: req.headers.get("user-agent") || "Unknown",
        },
      });

      return NextResponse.json(
        { error: "Access Denied. Your account has been suspended. Please contact administration." },
        { status: 403 }
      );
    }

    // 4. Check if user has an active OTP and verify the 30-second resend limit
    const existingOtp = await prisma.otp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingOtp && existingOtp.resendAt > new Date()) {
      const remainingSeconds = Math.ceil(
        (existingOtp.resendAt.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          retryAfter: remainingSeconds,
        },
        { status: 429 }
      );
    }

    // 5. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const resendAt = new Date(Date.now() + 30 * 1000); // 30 seconds cooldown

    // Clear old OTPs and store the new OTP in database
    await prisma.$transaction([
      prisma.otp.deleteMany({ where: { userId: user.id } }),
      prisma.otp.create({
        data: {
          code: otpCode,
          expiresAt,
          resendAt,
          userId: user.id,
        },
      }),
    ]);

    // 6. Send email notification
    await sendOtpEmail(user.email, otpCode);

    // Create activity log entry
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "OTP_REQUESTED",
        details: `OTP code sent to email: ${user.email}`,
      },
    });

    return NextResponse.json({
      success: true,
      email: user.email,
    });
  } catch (err) {
    console.error("Pre-login error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
