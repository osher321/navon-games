/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'Varela Round', 'system-ui', 'sans-serif'],
        fun: ['Baloo 2', 'Varela Round', 'Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        sunny: {
          50: '#fff9e6',
          100: '#fff0b8',
          200: '#ffe485',
          300: '#ffd452',
          400: '#ffc22b',
          500: '#ffab00',
          600: '#e88f00',
        },
        candy: {
          50: '#fff0f6',
          100: '#ffd6e8',
          200: '#ffadd2',
          300: '#ff7eb6',
          400: '#ff4f9a',
          500: '#ff2d82',
          600: '#e01268',
        },
        sky: {
          50: '#eefcff',
          100: '#d2f6ff',
          200: '#a6ecff',
          300: '#70dcff',
          400: '#38c4ff',
          500: '#0aa8f0',
          600: '#0086c9',
        },
        grass: {
          50: '#effff5',
          100: '#d3ffe4',
          200: '#a6ffca',
          300: '#6dfaa8',
          400: '#38e884',
          500: '#12cc65',
          600: '#0aa552',
        },
        grape: {
          50: '#f6f0ff',
          100: '#e6d6ff',
          200: '#cbadff',
          300: '#a97bff',
          400: '#8a4dff',
          500: '#7226f5',
          600: '#5d16d4',
        },
        ink: '#2c2450',
      },
      boxShadow: {
        pop: '0 10px 0 rgba(0,0,0,0.08), 0 18px 30px -10px rgba(0,0,0,0.18)',
        card: '0 6px 0 rgba(0,0,0,0.06), 0 14px 24px -8px rgba(0,0,0,0.15)',
        glow: '0 0 0 4px rgba(255,255,255,0.6), 0 10px 30px -6px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        blob: '2rem',
        xl2: '1.75rem',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(3deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,171,0,0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255,171,0,0)' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        wiggle: 'wiggle 1.4s ease-in-out infinite',
        popIn: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseGlow: 'pulseGlow 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
