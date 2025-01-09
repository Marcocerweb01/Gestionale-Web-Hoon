/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-orange': '#FF5722',
      },
      screens: {
        sm: { min: '300px', max: '819px' }, // Smartphone
      md: { min: '820px', max: '1023px' }, // Tablet
      lg: { min: '1024px' }, // PC e oltre
      },
    },
  },
  plugins: [],
}