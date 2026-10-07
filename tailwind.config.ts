import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Warna mengikuti brand aktif (lihat :root & [data-brand] di globals.css)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: v("ink"),
        cream: v("cream"),
        sand: v("sand"),
        blush: v("blush"),
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), light: v("brand-light") },
        accent: { DEFAULT: v("accent"), light: v("accent-light"), ink: v("accent-ink") },
        sage: "#7C8B6F",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
