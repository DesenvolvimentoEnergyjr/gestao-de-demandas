import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#ffc20e",
        "primary-dark": "#ff8c00",
        secondary: "#0baf4d",
        "secondary-dark": "#165b3b",
        "bg-base": "#09090b",
        "bg-section": "#18181b",
        "bg-surface": "rgba(255, 255, 255, 0.02)",
        "bg-surface-hover": "rgba(255, 255, 255, 0.05)",
        "text-main": "#fafafa",
        "text-muted": "#a1a1aa",
        "border-subtle": "rgba(255, 255, 255, 0.15)",
        
        // Status Colors
        status: {
          backlog: "#71717a",
          escopo: "#8b5cf6",
          progresso: "#0ea5e9",
          revisao: "#f59e0b",
          concluido: "#10b981",
        },

        // Priority Colors
        "priority-urgente": "#ef4444", // red-500
        "priority-alta": "#f97316",    // orange-500
        "priority-media": "#eab308",   // yellow-500
        "priority-baixa": "#71717a",   // zinc-500

        // Generic Tag Colors
        "tag-1": "#ef4444",  // red-500
        "tag-2": "#f97316",  // orange-500
        "tag-3": "#f59e0b",  // amber-500
        "tag-4": "#84cc16",  // lime-500
        "tag-5": "#22c55e",  // green-500
        "tag-6": "#10b981",  // emerald-500
        "tag-7": "#14b8a6",  // teal-500
        "tag-8": "#06b6d4",  // cyan-500
        "tag-9": "#0ea5e9",  // sky-500
        "tag-10": "#3b82f6", // blue-500
        "tag-11": "#6366f1", // indigo-500
        "tag-12": "#8b5cf6", // violet-500
        "tag-13": "#a855f7", // purple-500
        "tag-14": "#d946ef", // fuchsia-500
        "tag-15": "#ec4899", // pink-500
        "tag-16": "#f43f5e", // rose-500
      },
      boxShadow: {
        'glow': '0 0 20px rgba(11, 175, 77, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
