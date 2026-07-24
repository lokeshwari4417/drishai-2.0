"use client";

/**
 * Cloud Sync Module
 * -------------------
 * DrishAI's screening data lives in a central database, but screening
 * camps often happen with no signal. If saving a screening fails because
 * the device is offline (not because of a validation error — we
 * distinguish the two), it's queued in localStorage and retried
 * automatically the moment the browser regains connectivity.
 *
 * This is intentionally simple (localStorage, not IndexedDB) since the
 * payloads are small compressed JPEG previews, not full-resolution images.
 */

const QUEUE_KEY = "drishai:pending-screenings";

export interface QueuedScreening {
  id: string; // client-generated, for de-duping / display only
  patientId: string;
  eyeSide: "LEFT" | "RIGHT";
  imageDataUrl: string;
  grade: number;
  confidence: number;
  modelVersion: string;
  queuedAt: string;
}

function readQueue(): QueuedScreening[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedScreening[]) {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent("drishai:queue-changed"));
}

export function enqueueScreening(item: Omit<QueuedScreening, "id" | "queuedAt">) {
  const queue = readQueue();
  queue.push({ ...item, id: crypto.randomUUID(), queuedAt: new Date().toISOString() });
  writeQueue(queue);
}

export function getQueue(): QueuedScreening[] {
  return readQueue();
}

/** True network failures throw a TypeError in fetch; HTTP error responses don't. */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

/** Attempts to POST every queued screening; removes each on success, stops at the first failure. */
export async function flushQueue(): Promise<{ synced: number; remaining: number }> {
  const queue = readQueue();
  let synced = 0;

  while (queue.length > 0) {
    const item = queue[0];
    try {
      const res = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: item.patientId,
          eyeSide: item.eyeSide,
          imageDataUrl: item.imageDataUrl,
          grade: item.grade,
          confidence: item.confidence,
          modelVersion: item.modelVersion,
        }),
      });
      if (!res.ok) {
        // A real (non-network) error — drop it so it doesn't block the
        // queue forever, but stop here rather than silently discarding more.
        queue.shift();
        writeQueue(queue);
        break;
      }
      queue.shift();
      synced++;
      writeQueue(queue);
    } catch (err) {
      if (isNetworkError(err)) break; // still offline — stop, try again later
      queue.shift();
      writeQueue(queue);
    }
  }

  return { synced, remaining: readQueue().length };
}
