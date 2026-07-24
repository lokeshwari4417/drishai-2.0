import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const otps = await prisma.otp.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Return the last 100 OTP codes in system
    });

    return NextResponse.json(otps);
  } catch (err) {
    console.error("GET OTP logs error:", err);
    return NextResponse.json(
      { error: "Could not load OTP logs" },
      { status: 500 }
    );
  }
}
