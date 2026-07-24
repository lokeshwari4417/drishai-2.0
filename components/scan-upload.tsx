"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, ImageIcon } from "lucide-react";
import { preprocessImage, ProcessedImage } from "@/lib/image-preprocess";
import { runInference, InferenceResult } from "@/lib/ai-inference";
import { stageByGrade } from "@/lib/dr-stages";
import { enqueueScreening, isNetworkError } from "@/lib/offline-queue";
import SeverityBadge from "@/components/severity-badge";
import ScanRing from "@/components/scan-ring";

type Stage = "idle" | "preprocessing" | "inferring" | "done" | "saving" | "error";

export default function ScanUpload({
  patientId,
  reportBasePath,
}: {
  patientId: string;
  /** e.g. "/patient/history" or "/report" — where "View full report" links after saving */
  reportBasePath: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [eyeSide, setEyeSide] = useState<"LEFT" | "RIGHT">("LEFT");
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [savedScreeningId, setSavedScreeningId] = useState<string | null>(null);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setSavedScreeningId(null);

    try {
      setStage("preprocessing");
      const proc = await preprocessImage(file);
      setProcessed(proc);

      setStage("inferring");
      const inference = await runInference(proc.canvas);
      setResult(inference);
      setStage("done");
    } catch (err) {
      console.error(err);
      setError("Couldn't process that image. Try a different file.");
      setStage("error");
    }
  }

  async function handleSave() {
    if (!processed || !result) return;
    setStage("saving");
    setError(null);

    try {
      const res = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          eyeSide,
          imageDataUrl: processed.previewDataUrl,
          grade: result.grade,
          confidence: result.confidence,
          modelVersion: result.modelVersion,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }

      const saved = await res.json();
      setSavedScreeningId(saved.id);
      setStage("done");
      router.refresh();
    } catch (err) {
      console.error(err);

      if (isNetworkError(err) && processed && result) {
        enqueueScreening({
          patientId,
          eyeSide,
          imageDataUrl: processed.previewDataUrl,
          grade: result.grade,
          confidence: result.confidence,
          modelVersion: result.modelVersion,
        });
        setQueuedOffline(true);
        setStage("done");
        return;
      }

      setError("Couldn't save this screening. Please try again.");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setProcessed(null);
    setResult(null);
    setSavedScreeningId(null);
    setQueuedOffline(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const stageInfo = result ? stageByGrade(result.grade) : null;
  const busy = stage === "preprocessing" || stage === "inferring" || stage === "saving";

  return (
    <div className="card">
      <h2 className="font-display text-lg text-neutral-900">Take / upload a retinal scan</h2>
      <p className="mt-1 text-sm text-neutral-500">
        JPG or PNG fundus image. Analysis runs on-device in your browser — the image isn't sent anywhere unless you save the result.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label className="label !mb-0">Eye</label>
        <div className="flex overflow-hidden rounded-lg border border-neutral-300">
          {(["LEFT", "RIGHT"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setEyeSide(side)}
              disabled={busy}
              className={`px-3 py-1.5 text-sm transition-colors ${
                eyeSide === side ? "bg-brand-600 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {side === "LEFT" ? "Left" : "Right"}
            </button>
          ))}
        </div>
      </div>

      {!processed && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragActive ? "border-brand-500 bg-brand-50" : "border-neutral-300 hover:border-brand-300 hover:bg-neutral-50"
          }`}
        >
          {dragActive ? (
            <UploadCloud className="h-8 w-8 text-brand-500" />
          ) : (
            <ImageIcon className="h-8 w-8 text-neutral-400" />
          )}
          <p className="text-sm font-medium text-neutral-700">
            {dragActive ? "Drop to upload" : "Drag & drop a fundus image, or click to browse"}
          </p>
          <p className="text-xs text-neutral-400">JPG or PNG</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            capture="environment"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </div>
      )}

      {(stage === "preprocessing" || stage === "inferring") && (
        <div className="mt-6 flex flex-col items-center gap-3 py-4">
          <ScanRing mode="loading" color={stage === "inferring" ? "#1f7373" : "#e8a33d"} size={88} />
          <p className="text-sm text-neutral-500">
            {stage === "preprocessing" ? "Enhancing image…" : "Running on-device AI analysis…"}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 animate-fade-in rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {processed && result && stageInfo && (
        <div className="mt-5 grid animate-fade-up gap-5 sm:grid-cols-[160px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={processed.previewDataUrl}
            alt="Preprocessed fundus scan preview"
            className="h-40 w-40 rounded-xl border border-neutral-200 object-cover"
          />

          <div>
            <div className="flex items-center gap-4">
              <ScanRing mode="result" value={result.confidence} color={stageInfo.colorHex} size={72} label="confidence" />
              <div>
                <SeverityBadge stageKey={stageInfo.key} />
                <p className="mt-1 font-mono text-xs text-neutral-400">{result.inferenceMs}ms inference</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-700">{stageInfo.recommendation}</p>

            {result.isMock && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Demo mode: no trained model found at <code>/models/dr-model</code>, so this
                result is from a placeholder inference function — not a real clinical
                prediction. Drop your model files in to get real grades.
              </p>
            )}

            {queuedOffline && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                No connection right now — this screening is saved on this device and will sync automatically once you're back online.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              {!savedScreeningId && !queuedOffline ? (
                <button onClick={handleSave} disabled={busy} className="btn-primary">
                  {stage === "saving" ? "Saving…" : "Save to patient record"}
                </button>
              ) : savedScreeningId ? (
                <a href={`${reportBasePath}/${savedScreeningId}`} className="btn-primary animate-pop-in">
                  View full report
                </a>
              ) : null}
              <button onClick={reset} disabled={busy} className="btn-secondary">
                {savedScreeningId || queuedOffline ? "Screen another eye" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
