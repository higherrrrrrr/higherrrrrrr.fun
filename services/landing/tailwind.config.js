/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
        'terminal-blink': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' }
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(4px)' }
        },
        'fade-in': {
          'from': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      animation: {
        'terminal-blink': 'terminal-blink 1s step-end infinite',
        'pulse-subtle': 'pulse-subtle 2s infinite',
        'bounce-subtle': 'bounce-subtle 1.5s infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards'
      }
    },
  },
  plugins: [
    function({ addUtilities, addComponents }) {
      addUtilities({
        '.text-shadow-terminal': {
          textShadow: '0 0 2px rgba(74, 222, 128, 0.4), 0 0 4px rgba(74, 222, 128, 0.2)'
        },
        '.grid-pattern': {
          backgroundImage: 'radial-gradient(rgba(0, 30, 0, 0.4) 2px, transparent 0)',
          backgroundSize: '32px 32px',
          backgroundPosition: '-16px -16px'
        }
      }),
      addComponents({
        '.timer-snake-border': {
          '@apply relative border-2 border-green-500/20 rounded-lg bg-black/50': {},
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'inset': '4px',
            'border': '2px solid rgba(0, 255, 0, 0.1)',
            'borderRadius': '6px',
            'pointerEvents': 'none',
            'transition': 'all 0.3s'
          }
        }
      })
    }
  ],
};
