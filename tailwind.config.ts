import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16202b", // deep navy-black — primary text & chrome
        paper: "#eef1ec", // cool onion-skin paper — background
        accent: "#f0b429", // highlighter yellow — reserved for the one primary action per screen
        risk: "#b1372d", // redline red — risk/high-severity ink
        stamp: "#1f6f6b", // notary-stamp teal — secondary/tertiary accent
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        doc: ["IBM Plex Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
