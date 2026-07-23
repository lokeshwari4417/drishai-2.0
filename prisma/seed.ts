import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Role = "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";

async function upsertUser(name: string, email: string, role: Role) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role, passwordHash },
  });
}

async function main() {
  const admin = await upsertUser("Admin User", "admin@drishai.dev", "ADMIN");
  const doctor = await upsertUser("Dr. Anjali Rao", "doctor@drishai.dev", "DOCTOR");
  const ngo = await upsertUser("Vision NGO Coordinator", "ngo@drishai.dev", "NGO");
  const patientUser = await upsertUser("Ravi Kumar", "patient@drishai.dev", "PATIENT");

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

  console.log("Seeded demo accounts (password: password123):");
  console.log({ admin: admin.email, doctor: doctor.email, ngo: ngo.email, patient: patientUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
