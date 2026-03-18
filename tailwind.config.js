/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04080f",
          900: "#070d1a",
          800: "#0b1426",
          700: "#111e38",
          600: "#172847",
        },
        teal: {
          400: "#2dd4bf",
          300: "#5eead4",
          200: "#99f6e4",
        },
        gold: {
          500: "#c8a96e",
          400: "#e0c080",
          300: "#f0d8a0",
          200: "#f8eccc",
        },
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Raleway'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
