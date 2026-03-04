/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA', // Lightest gray for app background
        surface: '#FFFFFF',    // Pure white for cards
        surfaceHover: '#F3F4F6', // gray-100 for hover states
        primary: '#22C55E',    // Tailwind green-500
        secondary: '#16A34A',  // Tailwind green-600
        textMain: '#111827',   // gray-900 for primary text
        textMuted: '#6B7280',  // gray-500 for secondary text
        border: '#E5E7EB',     // gray-200 for borders
      }
    },
  },
  plugins: [],
}
