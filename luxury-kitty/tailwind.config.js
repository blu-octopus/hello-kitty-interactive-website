/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        emeraldDeep: '#052e23',
        kittyPink: '#ff5c8d',
        kittyLightPink: '#ffb3d2',
        kittyBlush: '#ffe0ec',
        luxeGold: '#f6d88c',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      dropShadow: {
        glow: '0 0 25px rgba(246, 216, 140, 0.65)',
      },
    },
  },
  plugins: [],
}

