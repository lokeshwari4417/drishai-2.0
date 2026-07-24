import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Seed Roles
  const roles = ["PATIENT", "DOCTOR", "NGO", "ADMIN"];
  const dbRoles: Record<string, any> = {};

  for (const roleName of roles) {
    dbRoles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
  console.log("Roles seeded.");

  // Helper to upsert a user with roleId
  const passwordHash = await bcrypt.hash("password123", 10);
  async function upsertUser(name: string, email: string, roleName: string) {
    const roleId = dbRoles[roleName].id;
    return prisma.user.upsert({
      where: { email },
      update: { roleId },
      create: {
        name,
        email,
        passwordHash,
        roleId,
      },
    });
  }

  // 2. Seed Users
  const admin = await upsertUser("Admin User", "admin@drishai.dev", "ADMIN");
  const myAdmin = await upsertUser("Logeshwari Admin", "lokeshwariiiiii.1@gmail.com", "ADMIN");
  const doctor = await upsertUser("Dr. Anjali Rao", "doctor@drishai.dev", "DOCTOR");
  const ngo = await upsertUser("Vision NGO Coordinator", "ngo@drishai.dev", "NGO");
  const patientUser = await upsertUser("Ravi Kumar", "patient@drishai.dev", "PATIENT");

  console.log("Users seeded.");

  // 3. Create Admin profile
  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });
  await prisma.admin.upsert({
    where: { userId: myAdmin.id },
    update: {},
    create: { userId: myAdmin.id },
  });
  console.log("Admin profile created.");

  // 4. Create Patient profile
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      name: "Ravi Kumar",
      age: 54,
      gender: "Male",
      diabetesDuration: 8,
      contactNumber: "+91-90000-00000",
      userId: patientUser.id,
      createdById: doctor.id,
    },
  });
  console.log("Patient profile created.");

  // 5. Create some mock login history and activity logs for analytics demo
  // Check if we already have history/activity
  const historyCount = await prisma.loginHistory.count();
  if (historyCount === 0) {
    const now = new Date();
    await prisma.loginHistory.createMany({
      data: [
        { userId: admin.id, status: "SUCCESS", ipAddress: "127.0.0.1", userAgent: "Mozilla/5.0", loggedAt: new Date(now.getTime() - 1000 * 60 * 5) },
        { userId: doctor.id, status: "SUCCESS", ipAddress: "127.0.0.2", userAgent: "Chrome/114.0", loggedAt: new Date(now.getTime() - 1000 * 60 * 30) },
        { userId: ngo.id, status: "SUCCESS", ipAddress: "127.0.0.3", userAgent: "Safari/16.1", loggedAt: new Date(now.getTime() - 1000 * 60 * 60) },
        { userId: patientUser.id, status: "SUCCESS", ipAddress: "127.0.0.4", userAgent: "Firefox/113.0", loggedAt: new Date(now.getTime() - 1000 * 60 * 120) },
        { userId: admin.id, status: "FAILED", ipAddress: "192.168.1.50", userAgent: "Unknown Scanner", loggedAt: new Date(now.getTime() - 1000 * 60 * 10) },
      ]
    });

    await prisma.activityLog.createMany({
      data: [
        { userId: admin.id, action: "USER_MANAGEMENT", details: "Admin accessed user management panel" },
        { userId: doctor.id, action: "PATIENT_CREATION", details: "Created patient profile for Ravi Kumar" },
        { userId: ngo.id, action: "SCREENING_ROUTE", details: "Routed screening request to Dr. Anjali Rao" },
        { userId: admin.id, action: "SYSTEM_SEEDED", details: "Admin seeded the database with default accounts" },
      ]
    });
    console.log("Mock analytics data seeded.");
  }

  console.log("Seeding complete successfully! Demo accounts (password: password123):");
  console.log({
    admin: admin.email,
    doctor: doctor.email,
    ngo: ngo.email,
    patient: patientUser.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
