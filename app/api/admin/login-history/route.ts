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
    const history = await prisma.loginHistory.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { loggedAt: "desc" },
      take: 100, // Return the last 100 login attempts
    });

    return NextResponse.json(history);
  } catch (err) {
    console.error("GET login history error:", err);
    return NextResponse.json(
      { error: "Could not load login history" },
      { status: 500 }
    );
  }
}
