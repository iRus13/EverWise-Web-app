/** @type {import('tailwindcss').Config} */
export default {
  future: { hoverOnlyWhenSupported: true },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic neutral surfaces with a restrained Everwise accent
        cream: {
          DEFAULT: "#F5F5F7", // calm cream background
          card: "#FFFFFF", // slightly lighter card / surface
          deep: "#E8E8ED", // subtle contrast surface
        },
        ink: {
          DEFAULT: "#1D1D1F", // near-black text
          soft: "#64646B", // muted body text
          faint: "#74747B", // captions / locked
        },
        clay: {
          DEFAULT: "#98482F", // clay / terracotta primary action
          dark: "#783720", // pressed / hover
          soft: "#C97A5C",
        },
        sage: {
          DEFAULT: "#42745A", // green = done / safe
          dark: "#326046",
          soft: "#7E9B6E",
        },
        alert: {
          DEFAULT: "#AF302E", // muted red = scam warning
          soft: "#C86A5E",
        },
        locked: "#C9C3B6", // grey = locked
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        node: "0 6px 0 rgba(0,0,0,0.12)",
        "node-sage": "0 6px 0 #326046",
        "node-clay": "0 7px 0 #783720",
        "node-locked": "0 5px 0 #B4AE9F",
        card: "0 2px 10px rgba(34,32,28,0.06)",
        btn: "0 4px 0 #783720",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "70%": { transform: "scale(1.25)", opacity: "0" },
          "100%": { transform: "scale(1.25)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.18s ease-out both",
        "pop-in": "pop-in 0.18s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
