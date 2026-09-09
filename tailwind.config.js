/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        red: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#be123c',
          500: '#e11d48',
          600: '#be123c',
          650: '#9f1239',
          700: '#9f1239',
          800: '#881337',
          900: '#881337',
          950: '#4c0519',
        },
      },
    },
  },
  plugins: [],
}
