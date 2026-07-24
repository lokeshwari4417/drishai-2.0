import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Admin accounts are provisioned only via the database seed — the
  // public registration form must never be able to create one.
  role: z.enum(["PATIENT", "DOCTOR", "NGO"]),
  // Only used when role === PATIENT, to also create a Patient record
  age: z.number().int().positive().optional(),
  gender: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, role, age, gender } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const dbRole = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!dbRole) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        roleId: dbRole.id,
        isBlocked: role === "DOCTOR" || role === "NGO", // Doctors and NGOs require admin approval
      },
      include: { role: true },
    });

    // Patients get a linked Patient record automatically so they can
    // immediately see "their" profile in the dashboard.
    if (role === "PATIENT") {
      await prisma.patient.create({
        data: {
          name,
          age: age ?? 0,
          gender: gender ?? "Unspecified",
          userId: user.id,
          createdById: user.id,
        },
      });
    }

    // Send welcome email asynchronously
    import("@/lib/mail").then(({ sendWelcomeEmail }) => {
      sendWelcomeEmail(user.email, user.name);
    }).catch(console.error);

    return NextResponse.json({ id: user.id, email: user.email, role: user.role.name, isBlocked: user.isBlocked }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}