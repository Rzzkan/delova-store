import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2A1F1B",
        cream: "#FAF4EA",
        sand: "#EFE4D2",
        blush: "#F2DCD3",
        maroon: { DEFAULT: "#6B2330", dark: "#4E1722", light: "#8A3544" },
        gold: { DEFAULT: "#B8893B", light: "#D9B876" },
        sage: "#7C8B6F",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
