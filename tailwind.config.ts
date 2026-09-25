import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Using class strategy for dark mode
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        primary: '#38BDF8', // A neon-like blue for highlights
        accent: '#FACC15', // A golden accent for highlighted Sephira
      },
      keyframes: {
        glow: {
          '0%, 100%': { borderColor: '#FACC15', boxShadow: '0 0 5px #FACC15' },
          '50%': { borderColor: '#FACC15', boxShadow: '0 0 20px #FACC15, 0 0 30px #FACC15' },
        }
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
export default config
