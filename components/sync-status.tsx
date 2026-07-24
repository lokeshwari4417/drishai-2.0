"use client";

import { useEffect, useState } from "react";
import { CloudOff, CloudUpload, Check } from "lucide-react";
import { getQueue, flushQueue } from "@/lib/offline-queue";

export default function SyncStatus() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  async function refreshAndSync() {
    const queue = getQueue();
    setPending(queue.length);
    if (queue.length === 0 || !navigator.onLine) return;

    setSyncing(true);
    const { synced, remaining } = await flushQueue();
    setSyncing(false);
    setPending(remaining);
    if (synced > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }
  }

  useEffect(() => {
    refreshAndSync();

    const onQueueChanged = () => setPending(getQueue().length);
    const onOnline = () => refreshAndSync();

    window.addEventListener("drishai:queue-changed", onQueueChanged);
    window.addEventListener("online", onOnline);
    const interval = setInterval(refreshAndSync, 30_000);

    return () => {
      window.removeEventListener("drishai:queue-changed", onQueueChanged);
      window.removeEventListener("online", onOnline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pending === 0 && !justSynced) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 flex animate-fade-up items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-600 shadow-md">
      {justSynced && pending === 0 ? (
        <>
          <Check size={14} className="text-severity-0" />
          Synced
        </>
      ) : syncing ? (
        <>
          <CloudUpload size={14} className="animate-pulse text-brand-600" />
          Syncing {pending} screening{pending === 1 ? "" : "s"}…
        </>
      ) : (
        <>
          <CloudOff size={14} className="text-accent-500" />
          {pending} screening{pending === 1 ? "" : "s"} waiting to sync
        </>
      )}
    </div>
  );
}
