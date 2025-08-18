import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 *
 * This configuration centralizes all theme colors for the mini app.
 * To change the app's color scheme, simply update the 'primary' color value below.
 *
 * Example theme changes:
 * - Blue theme: primary: "#3182CE"
 * - Green theme: primary: "#059669"
 * - Red theme: primary: "#DC2626"
 * - Orange theme: primary: "#EA580C"
 */
export default {
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main theme color - change this to update the entire app's color scheme
        primary: "#8b5cf6", // Main brand color
        "primary-light": "#a78bfa", // For hover states
        "primary-dark": "#7c3aed", // For active states

        // Secondary colors for backgrounds and text
        secondary: "#f8fafc", // Light backgrounds
        "secondary-dark": "#334155", // Dark backgrounds

        // Legacy CSS variables for backward compatibility
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom spacing for consistent layout
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      // Custom container sizes
      maxWidth: {
        xs: "20rem",
        sm: "24rem",
        md: "28rem",
        lg: "32rem",
        xl: "36rem",
        "2xl": "42rem",
      },
      // Custom animations for typing effect
      keyframes: {
        "typing-text": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "typing-text": "typing-text 3s steps(30, end) forwards",
        blink: "blink 1s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
