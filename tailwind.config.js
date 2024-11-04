/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'caveat-brush': ['"Caveat Brush"', 'cursive'],
        'inter': ['Inter', 'sans-serif']
      },
    },
  },
  plugins: [],
}

