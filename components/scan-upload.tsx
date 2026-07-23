"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { preprocessImage, ProcessedImage } from "@/lib/image-preprocess";
import { runInference, InferenceResult } from "@/lib/ai-inference";
import { stageByGrade } from "@/lib/dr-stages";
import SeverityBadge from "@/components/severity-badge";

type Stage = "idle" | "preprocessing" | "inferring" | "done" | "saving" | "error";

export default function ScanUpload({
  patientId,
  reportBasePath,
}: {
  patientId: string;
  /** e.g. "/patient/history" or "/doctor/patients/abc123" — where "View full report" links after saving */
  reportBasePath: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [eyeSide, setEyeSide] = useState<"LEFT" | "RIGHT">("LEFT");
  const [processed, setProcessed] = useState<ProcessedImage | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [savedScreeningId, setSavedScreeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError("Couldn't save this screening. If you're offline, it will need to be retried once you're back online.");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setProcessed(null);
    setResult(null);
    setSavedScreeningId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const stageInfo = result ? stageByGrade(result.grade) : null;
  const busy = stage === "preprocessing" || stage === "inferring" || stage === "saving";

  return (
    <div className="card">
      <h2 className="font-medium text-neutral-900">Take / upload a retinal scan</h2>
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
              className={`px-3 py-1.5 text-sm ${
                eyeSide === side ? "bg-brand-600 text-white" : "bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {side === "LEFT" ? "Left" : "Right"}
            </button>
          ))}
        </div>
      </div>

      {!processed && (
        <div className="mt-4">
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
            className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
      )}

      {(stage === "preprocessing" || stage === "inferring") && (
        <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          {stage === "preprocessing" ? "Enhancing image…" : "Running on-device AI analysis…"}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {processed && result && stageInfo && (
        <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={processed.previewDataUrl}
            alt="Preprocessed fundus scan preview"
            className="h-40 w-40 rounded-xl border border-neutral-200 object-cover"
          />

          <div>
            <div className="flex items-center gap-2">
              <SeverityBadge stageKey={stageInfo.key} />
              <span className="text-sm text-neutral-500">
                {Math.round(result.confidence * 100)}% confidence · {result.inferenceMs}ms
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-700">{stageInfo.recommendation}</p>

            {result.isMock && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Demo mode: no trained model found at <code>/models/dr-model</code>, so this
                result is from a placeholder inference function — not a real clinical
                prediction. Drop your model files in to get real grades.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              {!savedScreeningId ? (
                <button onClick={handleSave} disabled={busy} className="btn-primary">
                  {stage === "saving" ? "Saving…" : "Save to patient record"}
                </button>
              ) : (
                <a href={`${reportBasePath}/${savedScreeningId}`} className="btn-primary">
                  View full report
                </a>
              )}
              <button onClick={reset} disabled={busy} className="btn-secondary">
                {savedScreeningId ? "Screen another eye" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
