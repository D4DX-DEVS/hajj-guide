/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gold/olive accent, lifted from the Kaaba-at-night moodboard.
        brand: {
          50: '#faf6ea',
          100: '#f3ead0',
          200: '#e6d29e',
          300: '#d6b66c',
          400: '#c29c45',
          500: '#a9822f',
          600: '#8a6b26',
          700: '#6d541e',
          800: '#574318',
          900: '#423212',
        },
        // Warm near-black, for the sidebar/header — same mood as the moodboard's dark panels.
        ink: {
          50: '#f4f4f2',
          100: '#e4e3de',
          200: '#c7c5ba',
          300: '#a3a094',
          400: '#726f60',
          500: '#4a4839',
          600: '#35332a',
          700: '#26251e',
          800: '#1a1912',
          900: '#100f0a',
        },
      },
    },
  },
  plugins: [],
};
