import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "#1A3C5E",
          50: "#EAF1F7",
          100: "#D5E3EF",
          200: "#ABC7DF",
          300: "#80ABCF",
          400: "#568FBF",
          500: "#2C73AF",
          600: "#235C8C",
          700: "#1A3C5E",
          800: "#132C45",
          900: "#0C1C2C",
        },
        forest: {
          DEFAULT: "#2E7D52",
          50: "#EAF5EF",
          100: "#D5EBDD",
          200: "#ABD7BC",
          300: "#81C39A",
          400: "#57AF79",
          500: "#2E7D52",
          600: "#256542",
          700: "#1C4C32",
          800: "#123221",
          900: "#091911",
        },
        terracotta: {
          DEFAULT: "#C4703A",
          50: "#F8EEE8",
          100: "#F1DDD1",
          200: "#E3BBA3",
          300: "#D69876",
          400: "#C87648",
          500: "#C4703A",
          600: "#9D5A2E",
          700: "#764323",
          800: "#4E2D17",
          900: "#27160C",
        },
        sand: "#F5F0E8",
      },
    },
  },
  plugins: [],
};
export default config;
