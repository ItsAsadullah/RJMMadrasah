/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // use the new package name, required for Tailwind v3.5+ / v4
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;