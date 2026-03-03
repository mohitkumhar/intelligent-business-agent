/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#F1F4F9',
          card: '#FFFFFF',
          border: '#E1E5F2',
          textMain: '#181a20',
          textMuted: '#3e424f',
          income: '#05759e',
          expense: '#e3ac1e',
          margin: '#ac3d31',
          aiStart: '#e14dcb',
          aiMid: '#a238e1',
          aiEnd: '#5f27a8'
        }
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
