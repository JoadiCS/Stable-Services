/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a0f1e',
          mid: '#111827',
          light: '#1a2540',
          deeper: '#060a14',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c97a',
          pale: '#f5e6c0',
        },
        offwhite: '#f7f5f0',
        muted: '#8b95a7',
        green: {
          DEFAULT: '#2d7a4a',
          light: '#3da362',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        soft: 'rgba(201,168,76,0.18)',
      },
      backgroundImage: {
        'grid-gold':
          'linear-gradient(rgba(201,168,76,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.04) 1px,transparent 1px)',
        'grid-gold-strong':
          'linear-gradient(rgba(201,168,76,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.08) 1px,transparent 1px)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-slow-reverse': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        'scroll-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
        'spin-slow-reverse': 'spin-slow-reverse 20s linear infinite',
        'scroll-left': 'scroll-left 35s linear infinite',
        'fade-in-up': 'fade-in-up 0.65s ease forwards',
      },
      letterSpacing: {
        widest2: '0.2em',
      },
    },
  },
  plugins: [],
};
