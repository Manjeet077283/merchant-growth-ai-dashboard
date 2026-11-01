/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003087", // Primary blue
          dark: "#001c48",
          light: "#EAF3FC",
        },
        action: {
          DEFAULT: "#0070E0", // Action blue
          hover: "#005bb8",
        },
        surface: {
          bg: "#F5F7FA", // Background
          card: "#FFFFFF", // Cards
          muted: "#EAF3FC", // Light blue tint
        },
        content: {
          main: "#172B4D", // Primary text
          muted: "#6B7A90", // Secondary text
          light: "#97A0AF",
        },
        paypal: {
          blue: "#003087",
          darkblue: "#001c48",
          action: "#0070E0",
          lightblue: "#EAF3FC",
          gold: "#FFC439",
          hovergold: "#F2BA36"
        }
      },
      boxShadow: {
        soft: "0 2px 14px 0 rgba(23, 43, 77, 0.05)",
        card: "0 4px 20px 0 rgba(23, 43, 77, 0.04)",
        hover: "0 8px 30px 0 rgba(23, 43, 77, 0.08)",
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
