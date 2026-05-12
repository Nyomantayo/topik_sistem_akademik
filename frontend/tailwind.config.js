/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   '#2563EB',
        secondary: '#1E293B',
        accent:    '#38BDF8',
        success:   '#22C55E',
        danger:    '#EF4444',
        warning:   '#F59E0B',
        'bg-base': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
