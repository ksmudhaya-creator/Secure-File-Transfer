/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',
          navy: '#0b1329',
          card: '#0f172a',
          cardBorder: '#1e293b',
          accent: '#38bdf8',
          glow: '#0284c7',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyber-glow': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'cyber-glow-success': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'cyber-glow-danger': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
      },
    },
  },
  plugins: [],
}
