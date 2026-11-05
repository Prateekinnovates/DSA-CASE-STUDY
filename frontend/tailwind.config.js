/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090d16',
          900: '#0f172a',
          850: '#131e36',
          800: '#1e293b',
          750: '#283548',
          700: '#334155',
        },
        emergency: {
          red: '#ef4444',
          'red-glow': '#ff0033',
          blue: '#3b82f6',
          'blue-glow': '#0066ff',
          amber: '#f59e0b',
          emerald: '#10b981',
          cyan: '#06b6d4',
          purple: '#a855f7',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-red': 'glowRed 2s ease-in-out infinite',
        'glow-blue': 'glowBlue 2s ease-in-out infinite',
      },
      keyframes: {
        glowRed: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(239, 68, 68, 0.9)' },
        },
        glowBlue: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(59, 130, 246, 0.9)' },
        }
      }
    },
  },
  plugins: [],
}

