import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  role: z.enum(["PATIENT", "DOCTOR", "NGO", "ADMIN"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "A valid role is required" }, { status: 400 });
    }

    // Find the role record corresponding to the role name
    const roleRecord = await prisma.role.findUnique({
      where: { name: parsed.data.role },
    });

    if (!roleRecord) {
      return NextResponse.json({ error: "Role not found" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { roleId: roleRecord.id },
      include: { role: true },
    });

    return NextResponse.json({ id: updated.id, role: updated.role.name });
  } catch (err) {
    console.error("PATCH user role error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
