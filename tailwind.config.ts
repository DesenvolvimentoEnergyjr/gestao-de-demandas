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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#ffc20e",
        secondary: "#0baf4d",
        "secondary-dark": "#165b3b",
        "bg-base": "#09090b",
        "bg-section": "#18181b",
        "bg-surface": "rgba(255, 255, 255, 0.02)",
        "bg-surface-hover": "rgba(255, 255, 255, 0.05)",
        "text-main": "#fafafa",
        "text-muted": "#a1a1aa",
        "border-subtle": "rgba(255, 255, 255, 0.15)",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(11, 175, 77, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
