import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Qollabi legacy tokens (kept as-is for existing markup)
        brand: {
          DEFAULT: "#5B5BD6",
          hover: "#4F4FC4",
          light: "#EEF2FF",
          50: "#F5F5FF",
        },
        border: "#E8E8EE",
        b2: "#D1D5DB",
        muted: {
          DEFAULT: "#6B7280",
          foreground: "#6B7280",
        },
        light: "#9CA3AF",

        // shadcn tokens — mapped to the Qollabi palette so primitives
        // visually match the existing UI without dark-mode overhead.
        background: "#FFFFFF",
        foreground: "#111827",
        primary: {
          DEFAULT: "#5B5BD6",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F3F4F6",
          foreground: "#111827",
        },
        accent: {
          DEFAULT: "#EEF2FF",
          foreground: "#5B5BD6",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        input: "#E8E8EE",
        ring: "#5B5BD6",
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
