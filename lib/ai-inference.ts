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
 * TO PLUG IN YOUR TRAINED MODEL:
 *   1. Export it as a TF.js layers/graph model (model.json + shard .bin files).
 *   2. Drop the files into /public/models/dr-model/  (so they're served at
 *      /models/dr-model/model.json).
 *   3. If your model's output isn't a 5-way softmax over
 *      [No DR, Mild, Moderate, Severe, Proliferative] in that order, adjust
 *      `interpretOutput()` below to match your model's actual output shape.
 *   That's it — no other code changes needed, `runInference()` will pick
 *   the real model up automatically and stop using the mock.
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
  return { grade: bestIdx as 0 | 1 | 2 | 3 | 4, confidence: bestVal };
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

  // Map texture variance (a rough proxy for lesion-like detail in a mock
  // context only) onto a stage 0-4, and mean brightness onto a confidence
  // band. This has no clinical meaning — it exists purely so the upload →
  // report → database flow can be built and tested before the real model
  // is wired in.
  const grade = Math.min(4, Math.floor(variance / 900)) as 0 | 1 | 2 | 3 | 4;
  const confidence = 0.72 + (mean % 20) / 100; // lands roughly in 0.72–0.91

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
      .div(255)
      .expandDims(0);
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
