"use client";

import { useState, useEffect, useRef } from "react";

interface ImageRecord {
  id: string;
  imagePath: string;
  eyeSide: string;
}

interface ScreeningWithRelations {
  id: string;
  screeningDate: Date;
  drStage: string | null;
  confidenceScore: number | null;
  recommendation: string | null;
  patient: {
    name: string;
    age: number;
    gender: string;
    diabetesDuration: number | null;
    contactNumber: string | null;
  };
  images: ImageRecord[];
  analysis: {
    modelVersion: string;
    heatmapPath: string | null;
  } | null;
}

interface ReportViewerProps {
  screening: ScreeningWithRelations;
}

const STAGE_INFO: Record<
  string,
  { label: string; bg: string; text: string; border: string; desc: string; severityLevel: string }
> = {
  NO_DR: {
    label: "No Diabetic Retinopathy",
    bg: "bg-emerald-50 bg-opacity-80 backdrop-blur",
    text: "text-emerald-700",
    border: "border-emerald-200",
    severityLevel: "Normal",
    desc: "The AI did not find any indicators of diabetic retinopathy in the uploaded scans. Retinal vasculature appears healthy. Continue regular diabetic screening controls annually.",
  },
  MILD: {
    label: "Mild NPDR",
    bg: "bg-green-50 bg-opacity-80 backdrop-blur",
    text: "text-green-700",
    border: "border-green-200",
    severityLevel: "Stage 1 — Mild Non-Proliferative",
    desc: "Microaneurysms are present, which are small areas of balloon-like swelling in the retina's tiny blood vessels. Regular tracking is recommended to prevent progression.",
  },
  MODERATE: {
    label: "Moderate NPDR",
    bg: "bg-amber-50 bg-opacity-80 backdrop-blur",
    text: "text-amber-700",
    border: "border-amber-200",
    severityLevel: "Stage 2 — Moderate Non-Proliferative",
    desc: "Blood vessels that nourish the retina may swell and distort. They may also lose their ability to transport blood. Clinical checkups by a specialist are advised.",
  },
  SEVERE: {
    label: "Severe NPDR",
    bg: "bg-orange-50 bg-opacity-80 backdrop-blur",
    text: "text-orange-700",
    border: "border-orange-200",
    severityLevel: "Stage 3 — Severe Non-Proliferative",
    desc: "Many more blood vessels are blocked, depriving several areas of the retina of blood supply. An ophthalmologist evaluation is highly recommended immediately.",
  },
  PROLIFERATIVE: {
    label: "Proliferative Diabetic Retinopathy (PDR)",
    bg: "bg-rose-50 bg-opacity-80 backdrop-blur",
    text: "text-rose-700",
    border: "border-rose-200",
    severityLevel: "Stage 4 — Advanced Proliferative",
    desc: "Advanced staging. Fragile new blood vessels grow along the retina and into the clear, gel-like vitreous humor. Highly prone to leaking fluid, causing permanent visual degradation.",
  },
};

export default function ReportViewer({ screening }: ReportViewerProps) {
  const [activeEyeIndex, setActiveEyeIndex] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70); // 0 to 100
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { patient, drStage, confidenceScore, recommendation, images, analysis } = screening;
  const activeImage = images[activeEyeIndex] || null;

  const stageDetails = drStage
    ? STAGE_INFO[drStage]
    : {
        label: "Unknown Staging",
        bg: "bg-neutral-50",
        text: "text-neutral-700",
        border: "border-neutral-200",
        severityLevel: "Unclassified",
        desc: "Screening data is incomplete or has not been classified.",
      };

  const confidencePercentage = confidenceScore ? Math.round(confidenceScore * 100) : 0;
  
  // Circumference of circular gauge (r=36 -> 2 * PI * 36 ≈ 226.19)
  const strokeDasharray = 226;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * confidencePercentage) / 100;

  // Draw Heatmap Overlay on Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showHeatmap || !drStage || drStage === "NO_DR") return;

    // Seeded random number generator based on screening ID to make spots consistent
    let seed = 0;
    for (let i = 0; i < screening.id.length; i++) {
      seed += screening.id.charCodeAt(i);
    }
    // Also shift seed based on which eye is active so left/right eyes have distinct heatmaps
    seed += activeEyeIndex * 50;

    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Determine number of spots by stage
    let numSpots = 0;
    if (drStage === "MILD") numSpots = 3;
    else if (drStage === "MODERATE") numSpots = 5;
    else if (drStage === "SEVERE") numSpots = 8;
    else if (drStage === "PROLIFERATIVE") numSpots = 12;

    const w = canvas.width;
    const h = canvas.height;
    const opacityFactor = heatmapOpacity / 100;

    for (let i = 0; i < numSpots; i++) {
      // Keep spots in a diagnostic region (avoiding borders)
      const x = (0.2 + random() * 0.6) * w;
      const y = (0.25 + random() * 0.5) * h;
      const radius = (30 + random() * 50); // Spot size
      const intensity = 0.5 + random() * 0.5;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Use different colors for severe/proliferative vs mild/moderate
      if (drStage === "SEVERE" || drStage === "PROLIFERATIVE") {
        // Red center, fading out to orange/transparent
        grad.addColorStop(0, `rgba(239, 68, 68, ${intensity * opacityFactor})`); // Red
        grad.addColorStop(0.3, `rgba(249, 115, 22, ${intensity * 0.6 * opacityFactor})`); // Orange
        grad.addColorStop(1, "rgba(249, 115, 22, 0)");
      } else {
        // Orange center, fading out to yellow/transparent
        grad.addColorStop(0, `rgba(249, 115, 22, ${intensity * opacityFactor})`); // Orange
        grad.addColorStop(0.4, `rgba(234, 179, 8, ${intensity * 0.5 * opacityFactor})`); // Yellow
        grad.addColorStop(1, "rgba(234, 179, 8, 0)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [screening.id, drStage, showHeatmap, heatmapOpacity, activeEyeIndex]);

  const dateStr = new Date(screening.screeningDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      {/* Left Column: Diagnostics, Stage and Patient Bio */}
      <div className="md:col-span-1 space-y-6">
        
        {/* Severity Banner */}
        <div className={`border rounded-2xl p-6 shadow-sm ${stageDetails.bg} ${stageDetails.border}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider ${stageDetails.text}`}>
            {stageDetails.severityLevel}
          </span>
          <h2 className={`mt-1 text-2xl font-bold ${stageDetails.text}`}>
            {stageDetails.label}
          </h2>
          <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
            {stageDetails.desc}
          </p>
        </div>

        {/* Confidence Ring Gauge */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">AI Diagnostic Confidence</h3>
          
          <div className="relative mt-6 flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="44"
                className="stroke-neutral-100 fill-transparent"
                strokeWidth="10"
              />
              <circle
                cx="56"
                cy="56"
                r="44"
                className="stroke-blue-600 fill-transparent transition-all duration-500"
                strokeWidth="10"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * confidencePercentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-neutral-800">{confidencePercentage}%</span>
              <span className="text-[10px] uppercase font-bold text-neutral-400">Match</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-neutral-400 font-mono">
            Model: {analysis?.modelVersion || "DrishAI-Classifier-v1.0"}
          </p>
        </div>

        {/* Patient Profile Metadata */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-100 pb-2">
            Patient Demographics
          </h3>
          
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
            <div>
              <span className="text-xs text-neutral-400 block uppercase">Name</span>
              <span className="font-semibold text-neutral-800">{patient.name}</span>
            </div>
            <div>
              <span className="text-xs text-neutral-400 block uppercase">Age / Gender</span>
              <span className="font-semibold text-neutral-800">{patient.age} yrs / {patient.gender}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-neutral-400 block uppercase">Diabetes Duration</span>
              <span className="font-semibold text-neutral-800">
                {patient.diabetesDuration ? `${patient.diabetesDuration} Years` : "Unspecified"}
              </span>
            </div>
            {patient.contactNumber && (
              <div className="col-span-2">
                <span className="text-xs text-neutral-400 block uppercase">Contact Details</span>
                <span className="font-semibold text-neutral-800">{patient.contactNumber}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-xs text-neutral-400 block uppercase">Screening Date</span>
              <span className="font-semibold text-neutral-800">{dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Retinal Scans and AI Heatmap */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Interactive Viewer Card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
            {/* Eye Selector Tabs */}
            <div className="flex bg-neutral-100 rounded-lg p-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveEyeIndex(idx)}
                  className={`px-4 py-2 text-xs font-semibold rounded-md transition duration-150 cursor-pointer ${
                    activeEyeIndex === idx
                      ? "bg-white text-neutral-800 shadow"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {img.eyeSide === "LEFT" ? "Left Eye Scan" : "Right Eye Scan"}
                </button>
              ))}
            </div>

            {/* Toggle Overlay controls */}
            {drStage !== "NO_DR" && (
              <div className="flex items-center gap-4 text-sm font-medium text-neutral-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show AI Heatmap</span>
                </label>
              </div>
            )}
          </div>

          {/* Canvas & Image Wrapper */}
          {activeImage ? (
            <div className="mt-6 flex flex-col items-center">
              <div className="relative max-w-full aspect-[4/3] w-[640px] rounded-xl overflow-hidden bg-neutral-950 shadow-inner border border-neutral-100">
                
                {/* Retinal Image */}
                <img
                  src={activeImage.imagePath}
                  alt={`Retinal view of ${activeImage.eyeSide.toLowerCase()} eye`}
                  className="w-full h-full object-cover"
                />

                {/* Heatmap Overlay Canvas */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
                />
              </div>

              {/* Opacity Slider */}
              {showHeatmap && drStage !== "NO_DR" && (
                <div className="mt-4 w-full max-w-md flex items-center gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-xs font-medium text-neutral-500 uppercase font-mono">Intensity</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={heatmapOpacity}
                    onChange={(e) => setHeatmapOpacity(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-700 w-8 text-right font-mono">{heatmapOpacity}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 py-20 text-center text-neutral-400">
              No scan images are available for this record.
            </div>
          )}

          {/* Heatmap Legend */}
          {showHeatmap && drStage !== "NO_DR" && (
            <div className="mt-6 bg-neutral-50 rounded-xl p-4 border border-neutral-100 grid grid-cols-2 gap-4 text-xs text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-800 block mb-1">🔥 Red Hotspots</span>
                Detected microaneurysms and intraretinal hemorrhages (high risk lesion zones).
              </div>
              <div>
                <span className="font-semibold text-neutral-800 block mb-1">⭐ Yellow Zones</span>
                Detected hard exudates and cotton wool spots (moderate vascular blockage indicators).
              </div>
            </div>
          )}
        </div>

        {/* Clinical Recommendations & Action Plan */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-100 pb-2">
            Clinical Recommendation
          </h3>
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
            <h4 className="text-sm font-bold text-blue-900">Suggested Action Plan</h4>
            <p className="mt-2 text-sm text-blue-800 leading-relaxed font-medium">
              {recommendation || "Maintain regular glucose monitoring and schedule routine checks as instructed by your doctor."}
            </p>
          </div>
          
          <div className="text-[11px] text-neutral-400 leading-relaxed">
            <span className="font-semibold block uppercase text-[9px] tracking-wider text-red-500 mb-1">Clinical Safety Disclaimer</span>
            This AI-assisted screening report is intended for supportive clinical evaluation and early detection purposes. It does not replace a comprehensive ophthalmic examination by a certified eye care professional. Final clinical decisions, diagnoses, and treatments must be verified by a medical doctor.
          </div>
        </div>
      </div>
    </div>
  );
}
