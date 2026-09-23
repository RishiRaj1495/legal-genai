import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14181f",
        paper: "#f7f5ef",
        accent: "#2f5d50",
        risk: "#b3452b",
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
