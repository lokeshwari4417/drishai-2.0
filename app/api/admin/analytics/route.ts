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
    const [
      totalUsers,
      totalPatients,
      totalScreenings,
      activeOtps,
      successLogins,
      failedLogins,
      blockedLogins,
      recentActivities,
      recentLogins,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.screeningRecord.count(),
      prisma.otp.count(),
      prisma.loginHistory.count({ where: { status: "SUCCESS" } }),
      prisma.loginHistory.count({ where: { status: { in: ["FAILED", "FAILED_OTP"] } } }),
      prisma.loginHistory.count({ where: { status: "BLOCKED" } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.loginHistory.findMany({
        orderBy: { loggedAt: "desc" },
        take: 5,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    // Compile role distribution
    const dbRoles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
      },
    });

    const rolesDistribution = dbRoles.reduce((acc: Record<string, number>, r) => {
      acc[r.name] = r._count.users;
      return acc;
    }, {});

    return NextResponse.json({
      summary: {
        users: totalUsers,
        patients: totalPatients,
        screenings: totalScreenings,
        activeOtps,
      },
      rolesDistribution,
      loginStats: {
        success: successLogins,
        failed: failedLogins,
        blocked: blockedLogins,
      },
      recentActivities,
      recentLogins,
    });
  } catch (err) {
    console.error("GET analytics error:", err);
    return NextResponse.json(
      { error: "Failed to compute admin analytics" },
      { status: 500 }
    );
  }
}
