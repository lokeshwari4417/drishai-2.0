import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountBlockedNotification } from "@/lib/mail";

const blockSchema = z.object({
  isBlocked: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot block your own administrative account." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "isBlocked boolean field is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { isBlocked } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isBlocked },
    });

    // If blocked, send email notification
    if (isBlocked) {
      await sendAccountBlockedNotification(updatedUser.email).catch(console.error);

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "BLOCK_USER",
          details: `Blocked user: ${updatedUser.email} (ID: ${updatedUser.id})`,
        },
      });
    } else {
      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "UNBLOCK_USER",
          details: `Unblocked user: ${updatedUser.email} (ID: ${updatedUser.id})`,
        },
      });
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked,
    });
  } catch (err) {
    console.error("Block API error:", err);
    return NextResponse.json(
      { error: "Failed to toggle block status" },
      { status: 500 }
    );
  }
}
