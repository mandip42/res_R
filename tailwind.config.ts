import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  plugins: [tailwindcssAnimate],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#f9fafb",
        primary: {
          DEFAULT: "#ff3131",
          foreground: "#0a0a0a"
        },
        muted: {
          DEFAULT: "#111827",
          foreground: "#9ca3af"
        },
        border: "#1f2933",
        card: {
          DEFAULT: "#050505",
          foreground: "#f9fafb"
        }
      },
      fontFamily: {
        sans: fontFamily.sans
      },
      boxShadow: {
        "glow-red": "0 0 40px rgba(255, 49, 49, 0.35)"
      }
    }
  }
};

export default config;
