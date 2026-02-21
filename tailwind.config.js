/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#22d3ee',
          green: '#22c55e',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(34,211,238,0.25), 0 8px 28px rgba(2,6,23,0.55)',
      },
    },
  },
  plugins: [],
};
