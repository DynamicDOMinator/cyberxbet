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
        fadeInOut: {
          "0%": { opacity: 0 },
          "10%": { opacity: 1 },
          "90%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },
      animation: {
        slideNumbers: "slideNumbers 2s ease-out forwards",
        "fade-in-out": "fadeInOut 3s ease-in-out",
      },
    },
  },
  plugins: [],
};
