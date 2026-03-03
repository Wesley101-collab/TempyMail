/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C10',
        surface: 'rgba(31, 40, 51, 0.4)',
        surfaceHover: 'rgba(31, 40, 51, 0.6)',
        primary: '#66FCF1',
        secondary: '#45A29E',
        textMain: '#C5C6C7',
        textMuted: '#8a8d91',
      }
    },
  },
  plugins: [],
}
