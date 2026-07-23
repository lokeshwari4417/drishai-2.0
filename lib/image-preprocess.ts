"use client";

/**
 * Image Processing Module
 * ------------------------
 * Runs entirely in the browser (canvas API) — no image ever leaves the
 * device unless the person explicitly saves a screening. Produces:
 *  - a resized/normalized square image ready for model input
 *  - a compressed base64 JPEG for storage/preview in the report
 */

export const MODEL_INPUT_SIZE = 224;

export interface ProcessedImage {
  /** HTMLCanvasElement holding the resized+enhanced image, for inference */
  canvas: HTMLCanvasElement;
  /** Compressed base64 data URL, safe to store/preview (~small footprint) */
  previewDataUrl: string;
}

/** Loads a File into an HTMLImageElement. */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image file"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Simple contrast enhancement: stretches the histogram of each RGB channel
 * so faint lesions (microaneurysms, haemorrhages) are easier to distinguish.
 * This is a lightweight stand-in for CLAHE, which isn't available in a
 * plain canvas — swap in a proper CLAHE/contrast library here if needed.
 */
function enhanceContrast(imageData: ImageData): ImageData {
  const { data } = imageData;
  let min = 255,
    max = 0;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const range = Math.max(max - min, 1);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = Math.round(((data[i + c] - min) / range) * 255);
    }
  }

  return imageData;
}

export async function preprocessImage(file: File): Promise<ProcessedImage> {
  const img = await loadImageFromFile(file);

  // Center-crop to a square, then resize to the model's expected input.
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MODEL_INPUT_SIZE;
  canvas.height = MODEL_INPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  ctx.putImageData(enhanceContrast(imageData), 0, 0);

  URL.revokeObjectURL(img.src);

  // A smaller JPEG for storing/displaying alongside the report.
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = 320;
  previewCanvas.height = 320;
  previewCanvas.getContext("2d")!.drawImage(canvas, 0, 0, 320, 320);
  const previewDataUrl = previewCanvas.toDataURL("image/jpeg", 0.75);

  return { canvas, previewDataUrl };
}
