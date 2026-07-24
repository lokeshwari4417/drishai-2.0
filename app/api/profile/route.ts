import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phoneNumber: z.string().optional(),
  // Patient-specific properties
  age: z.number().int().min(0).max(130).optional(),
  gender: z.string().min(1).optional(),
  contactNumber: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, phoneNumber, age, gender, contactNumber } = parsed.data;

    // Update the base User properties
    const userUpdate: any = {};
    if (name) userUpdate.name = name;
    if (phoneNumber !== undefined) userUpdate.phoneNumber = phoneNumber;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: userUpdate,
    });

    // If it's a patient, also update their linked Patient record
    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
      });

      if (patient) {
        await prisma.patient.update({
          where: { id: patient.id },
          data: {
            name: name || patient.name,
            age: age !== undefined ? age : patient.age,
            gender: gender || patient.gender,
            contactNumber: contactNumber !== undefined ? contactNumber : patient.contactNumber,
          },
        });
      }
    }

    // Log update activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATE",
        details: "User updated their profile details",
      },
    });

    return NextResponse.json({
      success: true,
      name: updatedUser.name,
    });
  } catch (err) {
    console.error("PATCH profile error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
