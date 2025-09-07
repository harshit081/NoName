import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(17 24 39)',
        foreground: 'rgb(249 250 251)',
        primary: {
          50: 'rgb(239 246 255)',
          500: 'rgb(59 130 246)',
          600: 'rgb(37 99 235)',
          700: 'rgb(29 78 216)',
        },
        gray: {
          800: 'rgb(31 41 55)',
          900: 'rgb(17 24 39)',
        },
      },
      animation: {
        'slide-in-up': 'slideInUp 200ms ease-out',
        'bounce-soft': 'bounce 1s ease-in-out infinite',
      },
      keyframes: {
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
} satisfies Config
