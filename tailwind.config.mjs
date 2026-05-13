/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'violet-deep': '#1A0E3D',
        'violet-mid': '#2D1B5E',
        'violet-darker': '#0F0820',
        'sinapsis-purple': '#3D2FA0',
        'accent-mint': '#5DCAA5',
        'accent-mint-dark': '#04342C',
        'accent-gold': '#D4A030',
        'accent-gold-dark': '#3D2A0A',
        'accent-yellow': '#F4D03F',
        'accent-silver': '#C0C0C0',
        'cream': '#F5F2FF',
        'cream-bg': '#F8F7FC',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      borderRadius: { 'card': '14px', 'pill': '20px' },
      boxShadow: {
        'card': '0 2px 8px rgba(26, 14, 61, 0.06)',
        'card-hover': '0 8px 24px rgba(26, 14, 61, 0.12)',
      },
    },
  },
  plugins: [],
};
