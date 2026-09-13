import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cosmos Events Premium Palette
        primary: '#00CBB3',
        'primary-dark': '#009B8A',
        'primary-light': '#1EDCC8',
        secondary: '#201751',
        'secondary-navy': '#16123D',
        'secondary-purple': '#7600FF',
        accent: {
          gold: '#FFB800',
          orange: '#F96A32',
          teal: '#00CBB3',
        },
        neutral: {
          light: '#EDEDED',
          dark: '#201751',
          navy: '#16123D',
        },
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
