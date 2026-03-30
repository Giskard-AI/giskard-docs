/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Match Sphinx colors
        giskard: {
          light: {
            bg: '#FFFFFF',
            text: '#0F1729',
            accent: '#0284C9',
          },
          dark: {
            bg: '#002929',
            text: '#C6FFFF',
            accent: '#C6FFFF',
          },
        },
      },
      fontFamily: {
        sans: ['Osmose', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
