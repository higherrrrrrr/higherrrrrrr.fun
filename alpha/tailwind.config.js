/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './layouts/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Pixelify Mono', 'monospace'],
      },
      colors: {
        background: '#000000',
        foreground: '#4ade80',
      },
      keyframes: {
        'progress-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'progress-pulse': 'progress-pulse 1s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
    },
  },
  plugins: [],
}