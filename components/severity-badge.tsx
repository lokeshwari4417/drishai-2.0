import { stageByKey, DrStageKey } from "@/lib/dr-stages";

export default function SeverityBadge({ stageKey }: { stageKey: DrStageKey | null | undefined }) {
  if (!stageKey) {
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
        Not screened
      </span>
    );
  }

  const stage = stageByKey(stageKey);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
      <span className={`h-2 w-2 rounded-full ${stage.colorClass}`} />
      {stage.label}
    </span>
  );
}
