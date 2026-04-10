import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5B5BD6",
          hover: "#4F4FC4",
          light: "#EEF2FF",
          50: "#F5F5FF",
        },
        border: "#E8E8EE",
        b2: "#D1D5DB",
        muted: "#6B7280",
        light: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
