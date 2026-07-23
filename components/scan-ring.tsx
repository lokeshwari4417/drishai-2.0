"use client";

/**
 * ScanRing — the app's one signature visual element.
 * Two modes:
 *  - `mode="loading"`: a sweeping arc that reads as "actively scanning"
 *  - `mode="result"`: a static ring filled to `value` (0-1), colored by
 *    `colorVar` (a CSS color), used to show the AI confidence score
 */
export default function ScanRing({
  mode,
  value = 0,
  color = "#1f7373",
  size = 96,
  label,
}: {
  mode: "loading" | "result";
  value?: number;
  color?: string;
  size?: number;
  label?: string;
}) {
  const stroke = size * 0.07;
  const radius = size / 2 - stroke;
  const circumference = 2 * Math.PI * radius;
  const dash = mode === "result" ? circumference * Math.min(Math.max(value, 0), 1) : circumference * 0.28;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Ambient concentric rings — decorative, purely atmospheric */}
      <span
        className="absolute inset-0 rounded-full border border-current opacity-20 animate-ring-pulse"
        style={{ color }}
      />

      <svg width={size} height={size} className={mode === "loading" ? "animate-scan-sweep" : ""}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
          className="text-neutral-400"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {mode === "result" && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold text-neutral-900">
            {Math.round(value * 100)}%
          </span>
          {label && <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>}
        </div>
      )}
    </div>
  );
}
