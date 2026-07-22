import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf5",
          100: "#d6f5e6",
          200: "#aeebce",
          300: "#7bdbb1",
          400: "#45c491",
          500: "#22a878",
          600: "#158761",
          700: "#126c4f",
          800: "#125641",
          900: "#0f4737",
        },
        severity: {
          0: "#22a878", // No DR
          1: "#7bc043", // Mild
          2: "#f2b134", // Moderate
          3: "#f2661a", // Severe
          4: "#d92b2b", // Proliferative
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
