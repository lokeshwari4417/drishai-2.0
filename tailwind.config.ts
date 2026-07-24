import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep clinical teal — trust without being generic SaaS-green.
        brand: {
          50: "#eef6f6",
          100: "#d7e9e9",
          200: "#a9d0d0",
          300: "#74b3b3",
          400: "#3d8f8f",
          500: "#1f7373",
          600: "#146060",
          700: "#0f4d4d",
          800: "#0c3d3d",
          900: "#082e2e",
        },
        // Warm amber accent — "sunrise" / vision motif, used sparingly.
        accent: {
          50: "#fdf6e9",
          100: "#faeac6",
          200: "#f4d18a",
          300: "#edb655",
          400: "#e8a33d",
          500: "#d88a1f",
          600: "#b06f17",
        },
        severity: {
          0: "#2e9e82", // No DR — calm teal-green
          1: "#8fbf3f", // Mild — yellow-green
          2: "#e8a33d", // Moderate — amber (echoes accent)
          3: "#e2703a", // Severe — burnt orange
          4: "#c43d3d", // Proliferative — red
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "scan-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "ring-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.15", transform: "scale(1.08)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "scan-sweep": "scan-sweep 2.2s linear infinite",
        "ring-pulse": "ring-pulse 2.4s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "pop-in": "pop-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
