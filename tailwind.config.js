/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Badge gradient classes are stored in Mongo and applied at runtime, so
  // Tailwind can't see them in source files. Safelist a generous palette
  // covering anything an admin might pick from the badge editor.
  safelist: [
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'bg-gradient-to-l',
    'bg-gradient-to-bl',
    'bg-gradient-to-t',
    'bg-gradient-to-b',
    {
      pattern:
        /^(from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(300|400|500|600|700)$/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['var(--font-vazir)', 'Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
        sans: ['var(--font-vazir)', 'Vazirmatn', 'Tahoma', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'rgb(var(--brand-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--brand-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--brand-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--brand-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--brand-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--brand-900-rgb) / <alpha-value>)',
        },
        orange: {
          50: 'rgb(var(--brand-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--brand-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--brand-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--brand-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--brand-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--brand-900-rgb) / <alpha-value>)',
        },
        italy: {
          green: '#009246',
          white: '#ffffff',
          red: '#ce2b37',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
