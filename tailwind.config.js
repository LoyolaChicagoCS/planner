/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50:  '#f9f0f3',
          100: '#f0d8e0',
          200: '#e0b0c0',
          300: '#cc7f97',
          400: '#b3506e',
          500: '#82284A', // LUC primary maroon
          600: '#6e1f3e',
          700: '#591832',
          800: '#421226',
          900: '#2c0c19',
        },
        gold: {
          50:  '#fdf9ee',
          100: '#f7edcc',
          200: '#efd899',
          300: '#e4c163',
          400: '#C8A951', // LUC primary gold
          500: '#b8943a',
          600: '#9a7a2e',
          700: '#7a6024',
          800: '#5a451a',
          900: '#3a2c10',
        },
      },
    },
  },
  plugins: [],
}
