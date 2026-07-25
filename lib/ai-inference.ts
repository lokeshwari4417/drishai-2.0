"use client";

import type { DrStageKey } from "@/lib/dr-stages";
import { DR_STAGES } from "@/lib/dr-stages";
import { MODEL_INPUT_SIZE } from "@/lib/image-preprocess";

/**
 * AI Inference Module
 * --------------------
 * Runs on-device via TensorFlow.js — the fundus image never leaves the
 * browser. This module tries to load a real model first; if none is
 * present yet, it falls back to a deterministic mock so the rest of the
 * app (report screen, DB writes, dashboards) is fully testable already.
 *
 * MODEL OUTPUT ORDER:
 *   This model was trained on Kaggle's APTOS dataset with folders read in
 *   alphabetical order, giving output index order:
 *     0=Mild, 1=Moderate, 2=No_DR, 3=Proliferate_DR, 4=Severe
 *   MODEL_INDEX_TO_GRADE below remaps that to this app's grade scale
 *   (0=No DR, 1=Mild, 2=Moderate, 3=Severe, 4=Proliferative).
 */

export interface InferenceResult {
  stageKey: DrStageKey;
  grade: 0 | 1 | 2 | 3 | 4;
  confidence: number; // 0–1
  modelVersion: string;
  isMock: boolean;
  inferenceMs: number;
}

const MODEL_URL = "/models/dr-model/model.json";

// Maps the trained model's raw output index -> this app's DR_STAGES grade
const MODEL_INDEX_TO_GRADE: Record<number, 0 | 1 | 2 | 3 | 4> = {
  0: 1, // Mild           -> grade 1 (Mild)
  1: 2, // Moderate       -> grade 2 (Moderate)
  2: 0, // No_DR          -> grade 0 (No DR)
  3: 4, // Proliferate_DR -> grade 4 (Proliferative)
  4: 3, // Severe         -> grade 3 (Severe)
};

let cachedModel: import("@tensorflow/tfjs").LayersModel | null | undefined;

/** Tries to fetch/load the real model once; caches the result (including "not found"). */
async function getModel() {
  if (cachedModel !== undefined) return cachedModel;

  try {
    const head = await fetch(MODEL_URL, { method: "HEAD" });
    if (!head.ok) {
      cachedModel = null;
      return cachedModel;
    }

    const tf = await import("@tensorflow/tfjs");
    cachedModel = await tf.loadLayersModel(MODEL_URL);
    return cachedModel;
  } catch {
    cachedModel = null;
    return cachedModel;
  }
}

function interpretOutput(
  probs: Float32Array | Int32Array | Uint8Array | number[]
): { grade: 0 | 1 | 2 | 3 | 4; confidence: number } {
  let bestIdx = 0;
  let bestVal = -Infinity;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > bestVal) {
      bestVal = probs[i];
      bestIdx = i;
    }
  }
  const grade = MODEL_INDEX_TO_GRADE[bestIdx];
  return { grade, confidence: bestVal };
}

/**
 * Deterministic mock: derives a pseudo-random-but-repeatable result from
 * the image's own pixel data, so the same image always grades the same
 * way during development/demos (rather than being random noise).
 */
function mockInference(canvas: HTMLCanvasElement): { grade: 0 | 1 | 2 | 3 | 4; confidence: number } {
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let sum = 0;
  let variance = 0;
  const n = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += brightness;
  }
  const mean = sum / n;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += (brightness - mean) ** 2;
  }
  variance = variance / n;

  const grade = Math.min(4, Math.floor(variance / 900)) as 0 | 1 | 2 | 3 | 4;
  const confidence = 0.72 + (mean % 20) / 100;

  return { grade, confidence: Math.min(confidence, 0.97) };
}

export async function runInference(canvas: HTMLCanvasElement): Promise<InferenceResult> {
  const start = performance.now();
  const model = await getModel();

  if (!model) {
    const { grade, confidence } = mockInference(canvas);
    return {
      stageKey: DR_STAGES[grade].key,
      grade,
      confidence,
      modelVersion: "mock-v0 (no model.json found at /models/dr-model)",
      isMock: true,
      inferenceMs: Math.round(performance.now() - start),
    };
  }

  const tf = await import("@tensorflow/tfjs");
  const result = tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(canvas)
      .resizeBilinear([MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
      .toFloat()
      .expandDims(0); // no .div(255) — the model has its own internal Rescaling layer
    return model.predict(tensor) as import("@tensorflow/tfjs").Tensor;
  });

  const probs = await result.data();
  result.dispose();

  const { grade, confidence } = interpretOutput(probs);

  return {
    stageKey: DR_STAGES[grade].key,
    grade,
    confidence,
    modelVersion: "dr-model (loaded from /models/dr-model)",
    isMock: false,
    inferenceMs: Math.round(performance.now() - start),
  };
}