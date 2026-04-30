/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0F1639",
        primary: "#15173D",
        "primary-light": "#2a2d5e",
        secondary: "#982598",
        "secondary-dark": "#7a1e7a",
        accent: "#E491C9",
      },
    },
  },
  plugins: [],
};
