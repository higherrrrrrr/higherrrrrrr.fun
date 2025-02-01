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
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'snake': {
          '0%': { 
            backgroundPosition: '-100% 0, -100% 100%, 0 -100%, 100% -100%',
            opacity: '0.4'
          },
          '25%': {
            backgroundPosition: '100% 0, -100% 100%, 0 -100%, 100% -100%',
            opacity: '0.6'
          },
          '50%': {
            backgroundPosition: '100% 0, 100% 100%, 0 -100%, 100% -100%',
            opacity: '0.8'
          },
          '75%': {
            backgroundPosition: '100% 0, 100% 100%, 0 100%, 100% -100%',
            opacity: '0.6'
          },
          '100%': {
            backgroundPosition: '100% 0, 100% 100%, 0 100%, 100% 100%',
            opacity: '0.4'
          }
        },
        'glitch-top': {
          '0%': { clip: 'rect(0, 9999px, 0, 0)', transform: 'translate(2px, -2px)' },
          '20%': { clip: 'rect(15px, 9999px, 16px, 0)', transform: 'translate(-2px, 0)' },
          '40%': { clip: 'rect(5px, 9999px, 40px, 0)', transform: 'translate(-2px, -2px)' },
          '60%': { clip: 'rect(30px, 9999px, 10px, 0)', transform: 'translate(0, 2px)' },
          '80%': { clip: 'rect(10px, 9999px, 30px, 0)', transform: 'translate(2px, -1px)' },
          '100%': { clip: 'rect(8px, 9999px, 14px, 0)', transform: 'translate(-1px, 2px)' }
        },
        'glitch-bottom': {
          '0%': { clip: 'rect(55px, 9999px, 56px, 0)', transform: 'translate(-2px, 0)' },
          '20%': { clip: 'rect(30px, 9999px, 34px, 0)', transform: 'translate(-1px, 2px)' },
          '40%': { clip: 'rect(10px, 9999px, 90px, 0)', transform: 'translate(-1px, -1px)' },
          '60%': { clip: 'rect(40px, 9999px, 60px, 0)', transform: 'translate(1px, 2px)' },
          '80%': { clip: 'rect(20px, 9999px, 50px, 0)', transform: 'translate(0, 1px)' },
          '100%': { clip: 'rect(70px, 9999px, 80px, 0)', transform: 'translate(2px, -2px)' }
        },
        'terminal-blink': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' }
        },
        'snake-travel': {
          '0%': { backgroundPosition: '50% 0, 50% 100%, 0 50%, 100% 50%' },
          '25%': { backgroundPosition: '100% 0, 0% 100%, 0 0%, 100% 100%' },
          '50%': { backgroundPosition: '50% 0, 50% 100%, 0 50%, 100% 50%' },
          '75%': { backgroundPosition: '0% 0, 100% 100%, 0 100%, 100% 0%' },
          '100%': { backgroundPosition: '50% 0, 50% 100%, 0 50%, 100% 50%' }
        }
      },
      animation: {
        'progress-pulse': 'progress-pulse 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'snake': 'snake 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'glitch-top': 'glitch-top 2s infinite linear alternate-reverse',
        'glitch-bottom': 'glitch-bottom 2s infinite linear alternate-reverse',
        'terminal-blink': 'terminal-blink 1s step-end infinite',
        'snake-travel': 'snake-travel 3s linear infinite'
      },
      textShadow: {
        'terminal': '0 0 2px rgba(74, 222, 128, 0.4), 0 0 4px rgba(74, 222, 128, 0.2)',
        'glitch': '0 0 2px #00ff00'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addComponents, addUtilities }) {
      addComponents({
        '.snake-border': {
          'position': 'relative',
          'border': '2px solid rgba(0, 255, 0, 0.15)',
          'transition': 'all 0.15s',
          'borderRadius': '8px',
          '&:hover': {
            'transform': 'scale(1.015)',
            '& .snake-line': {
              '@apply animate-snake-travel': {}
            },
            '&::after': {
              'borderColor': 'rgba(0, 255, 0, 0.4)',
              'boxShadow': '0 0 15px rgba(0, 255, 0, 0.15)'
            }
          },
          '& .snake-line': {
            'content': '""',
            'position': 'absolute',
            'top': '-2px',
            'left': '-2px',
            'right': '-2px',
            'bottom': '-2px',
            'borderRadius': '8px',
            'pointerEvents': 'none',
            'background': `
              linear-gradient(90deg, #00ff00 50%, transparent 50%) 50% 0,
              linear-gradient(90deg, #00ff00 50%, transparent 50%) 50% 100%,
              linear-gradient(0deg, #00ff00 50%, transparent 50%) 0 50%,
              linear-gradient(0deg, #00ff00 50%, transparent 50%) 100% 50%
            `,
            'backgroundRepeat': 'no-repeat',
            'backgroundSize': '20px 2px, 20px 2px, 2px 20px, 2px 20px'
          },
          '&::after': {
            'content': '""',
            'position': 'absolute',
            'inset': '16px',
            'border': '2px solid rgba(0, 255, 0, 0.1)',
            'borderRadius': '8px',
            'pointerEvents': 'none',
            'transition': 'all 0.3s'
          }
        },
        '.terminal-text': {
          '@apply text-green-500': {},
          'text-shadow': '0 0 2px rgba(74, 222, 128, 0.4), 0 0 4px rgba(74, 222, 128, 0.2)',
          'line-height': '1.6'
        },
        '.glitch-text': {
          '@apply relative inline-block text-green-500': {},
          'text-shadow': '0 0 2px #00ff00',
          'line-height': '1'
        }
      }),
      addUtilities({
        '.text-shadow-terminal': {
          textShadow: '0 0 2px rgba(74, 222, 128, 0.4), 0 0 4px rgba(74, 222, 128, 0.2)'
        },
        '.text-shadow-glitch': {
          textShadow: '0 0 2px #00ff00'
        }
      })
    }
  ],
}