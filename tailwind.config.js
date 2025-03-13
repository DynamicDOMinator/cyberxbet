/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideNumbers: {
          "0%": { transform: "translateY(-1000%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        slideNumbers: "slideNumbers 2s ease-out forwards",
      },
    },
  },
  plugins: [],
};
