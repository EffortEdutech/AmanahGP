import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        amanah: {
          green:       '#059669',
          'green-light': '#d1fae5',
          gold:        '#d97706',
          'gold-light':  '#fef3c7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
