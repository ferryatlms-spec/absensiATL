/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#ffb3b4",
        "on-surface": "#1f1b1b",
        "error-container": "#ffdad6",
        "secondary-container": "#feb700",
        "on-background": "#1f1b1b",
        "primary-fixed-dim": "#ffb3b4",
        "on-secondary-container": "#6b4b00",
        "on-tertiary-fixed": "#40000b",
        "surface-dim": "#e1d8d7",
        "secondary-fixed-dim": "#ffba20",
        "outline": "#8a7171",
        "error": "#ba1a1a",
        "on-secondary-fixed-variant": "#5e4200",
        "background": "#fff8f7",
        "on-primary-container": "#ea6b73",
        "on-error-container": "#93000a",
        "primary": "#390008",
        "tertiary-fixed": "#ffdada",
        "on-surface-variant": "#574142",
        "on-error": "#ffffff",
        "surface-bright": "#fff8f7",
        "primary-fixed": "#ffdad9",
        "inverse-surface": "#342f2f",
        "on-tertiary-container": "#fa5e6c",
        "surface-tint": "#a63841",
        "primary-container": "#600014",
        "tertiary": "#390009",
        "tertiary-container": "#600015",
        "surface-variant": "#eae0e0",
        "on-secondary-fixed": "#271900",
        "on-primary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-secondary": "#ffffff",
        "inverse-primary": "#ffb3b4",
        "secondary-fixed": "#ffdea8",
        "secondary": "#7c5800",
        "on-primary-fixed": "#40000a",
        "surface-container-low": "#fbf1f1",
        "surface-container": "#f5eceb",
        "outline-variant": "#ddc0bf",
        "on-tertiary-fixed-variant": "#900826",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#efe6e5",
        "inverse-on-surface": "#f8efee",
        "on-primary-fixed-variant": "#86202c",
        "surface-container-highest": "#eae0e0",
        "surface": "#fff8f7"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}