import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF6E5",
        paper: "#FFFDF8",
        ink: "#3E2F23",
        retro: {
          orange: "#FF6B35",
          teal: "#2EC4B6",
          yellow: "#FFD23F",
          pink: "#EF476F",
          sky: "#4D96FF",
        },
      },
      boxShadow: {
        "retro-sm": "2px 2px 0 #3E2F23",
        retro: "4px 4px 0 #3E2F23",
        "retro-lg": "6px 6px 0 #3E2F23",
      },
      fontFamily: {
        display: ['"Bungee"', "cursive"],
        body: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
