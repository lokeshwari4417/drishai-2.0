export type DrStageKey = "NO_DR" | "MILD" | "MODERATE" | "SEVERE" | "PROLIFERATIVE";

export const DR_STAGES: {
  key: DrStageKey;
  grade: 0 | 1 | 2 | 3 | 4;
  label: string;
  recommendation: string;
  colorClass: string;
  colorHex: string; // matches tailwind.config.ts `severity` palette — used where a raw CSS color is needed (e.g. ScanRing)
}[] = [
  {
    key: "NO_DR",
    grade: 0,
    label: "No DR",
    recommendation: "No signs of diabetic retinopathy detected. Continue annual screening.",
    colorClass: "bg-severity-0",
    colorHex: "#2e9e82",
  },
  {
    key: "MILD",
    grade: 1,
    label: "Mild",
    recommendation: "Early-stage changes detected. Re-screen in 9–12 months and maintain glycemic control.",
    colorClass: "bg-severity-1",
    colorHex: "#8fbf3f",
  },
  {
    key: "MODERATE",
    grade: 2,
    label: "Moderate",
    recommendation: "Noticeable retinal changes. Recommend follow-up with an ophthalmologist within 6 months.",
    colorClass: "bg-severity-2",
    colorHex: "#e8a33d",
  },
  {
    key: "SEVERE",
    grade: 3,
    label: "Severe",
    recommendation: "Significant retinal damage detected. Recommend ophthalmologist referral within 1 month.",
    colorClass: "bg-severity-3",
    colorHex: "#e2703a",
  },
  {
    key: "PROLIFERATIVE",
    grade: 4,
    label: "Proliferative DR",
    recommendation: "Advanced, sight-threatening changes detected. Urgent ophthalmologist referral advised.",
    colorClass: "bg-severity-4",
    colorHex: "#c43d3d",
  },
];

export function stageByKey(key: DrStageKey) {
  return DR_STAGES.find((s) => s.key === key)!;
}

export function stageByGrade(grade: number) {
  return DR_STAGES.find((s) => s.grade === grade)!;
}
