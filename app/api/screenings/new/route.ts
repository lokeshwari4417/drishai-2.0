import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const patientId = formData.get("patientId") as string;
    const leftFile = formData.get("leftImage") as File | null;
    const rightFile = formData.get("rightImage") as File | null;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    if (!leftFile && !rightFile) {
      return NextResponse.json({ error: "At least one retinal scan image is required" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Mock AI analysis values
    const stages = ["NO_DR", "MILD", "MODERATE", "SEVERE", "PROLIFERATIVE"];
    
    // Choose stage based on a pseudo-random chance, biased towards moderate/mild cases
    const rand = Math.random();
    let drStage = "NO_DR";
    if (rand > 0.85) drStage = "PROLIFERATIVE";
    else if (rand > 0.70) drStage = "SEVERE";
    else if (rand > 0.45) drStage = "MODERATE";
    else if (rand > 0.20) drStage = "MILD";

    const confidenceScore = parseFloat((0.85 + Math.random() * 0.14).toFixed(4)); // 85% to 99%

    let recommendation = "";
    switch (drStage) {
      case "NO_DR":
        recommendation = "No diabetic retinopathy signs detected. Maintain regular annual screenings and good glycemic control.";
        break;
      case "MILD":
        recommendation = "Mild non-proliferative diabetic retinopathy (NPDR) detected. Schedule a follow-up in 6-12 months and consult your doctor to manage blood sugar.";
        break;
      case "MODERATE":
        recommendation = "Moderate non-proliferative diabetic retinopathy (NPDR) detected. A consultation with an ophthalmologist is recommended within 3-6 months.";
        break;
      case "SEVERE":
        recommendation = "Severe non-proliferative diabetic retinopathy (NPDR) detected. High risk of progression. Prompt referral to an ophthalmologist (within 2-4 weeks) is strongly advised.";
        break;
      case "PROLIFERATIVE":
        recommendation = "Proliferative diabetic retinopathy (PDR) detected. High risk of permanent vision loss. Urgent referral to an ophthalmologist (within 1 week) for laser or anti-VEGF treatment.";
        break;
    }

    // Create the screening record first
    const screening = await prisma.screeningRecord.create({
      data: {
        patientId,
        drStage,
        confidenceScore,
        recommendation,
      },
    });

    const imageRecords = [];

    // Helper to save image
    async function saveImage(file: File, eyeSide: "LEFT" | "RIGHT") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".png";
      const filename = `${screening.id}_${eyeSide.toLowerCase()}_${Date.now()}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      await fs.writeFile(filepath, buffer);
      
      const dbPath = `/uploads/${filename}`;

      // Save RetinalImage record
      return prisma.retinalImage.create({
        data: {
          imagePath: dbPath,
          eyeSide,
          screeningId: screening.id,
        },
      });
    }

    let primaryImagePath = "";

    if (leftFile && leftFile.size > 0) {
      const img = await saveImage(leftFile, "LEFT");
      imageRecords.push(img);
      primaryImagePath = img.imagePath;
    }
    if (rightFile && rightFile.size > 0) {
      const img = await saveImage(rightFile, "RIGHT");
      imageRecords.push(img);
      if (!primaryImagePath) primaryImagePath = img.imagePath;
    }

    // Create AiAnalysis record
    // For heatmapPath, copy the primary image or fall back to it
    let heatmapPath = "";
    if (primaryImagePath) {
      const originalFilename = path.basename(primaryImagePath);
      const heatmapFilename = `heatmap_${originalFilename}`;
      const srcPath = path.join(uploadsDir, originalFilename);
      const destPath = path.join(uploadsDir, heatmapFilename);
      
      try {
        await fs.copyFile(srcPath, destPath);
        heatmapPath = `/uploads/${heatmapFilename}`;
      } catch (err) {
        console.error("Failed to copy heatmap image, falling back", err);
        heatmapPath = primaryImagePath;
      }
    }

    await prisma.aiAnalysis.create({
      data: {
        modelVersion: "DrishAI-YOLOv8-v1.5",
        heatmapPath,
        screeningId: screening.id,
      },
    });

    return NextResponse.json({
      success: true,
      screeningId: screening.id,
      drStage,
      confidenceScore,
    });
  } catch (error) {
    console.error("Screening creation error:", error);
    return NextResponse.json({ error: "Failed to process screening" }, { status: 500 });
  }
}
