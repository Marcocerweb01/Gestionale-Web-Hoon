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
  safelist: [
    'bg-green-50',
    'bg-green-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
    'bg-green-500',
    'bg-green-600',
    'bg-green-700',
    'bg-green-800',
    'bg-green-900',
    'hover:bg-green-50',
    'hover:bg-green-100',
    'hover:bg-green-200',
    'hover:bg-green-300',
    'hover:bg-green-400',
    'hover:bg-green-500',
    'hover:bg-green-600',
    'hover:bg-green-700',
    'hover:bg-green-800',
    'hover:bg-green-900',
  ],
  plugins: [],
}