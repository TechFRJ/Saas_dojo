/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        belt: {
          white: "#FFFFFF",
          blue: "#2563EB",
          purple: "#7C3AED",
          brown: "#92400E",
          black: "#111827",
        },
      },
    },
  },
  plugins: [],
};
