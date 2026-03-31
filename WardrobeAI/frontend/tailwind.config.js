/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00FFB2",
        dark: "#121212",
        darker: "#0A0A0A",
        card: "#1E1E1E",
      }
    },
  },
  plugins: [],
}
