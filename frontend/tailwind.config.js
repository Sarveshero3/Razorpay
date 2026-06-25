/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Obsidian & Carbon Neutral Palette
        obsidian: {
          DEFAULT: "#08090C",
          card: "#12141C",
          hover: "#181C26",
          accent: "#1F2433",
        },
        carbon: {
          light: "#94A3B8",
          border: "#1E293B",
          activeBorder: "#38BDF8", // Cyan highlight
          input: "#0F172A",
        },
        // Neon state indicator flags
        brand: {
          green: "#10B981", // Success approved indicator
          amber: "#F59E0B", // Warning pending indicator
          rose: "#EF4444",  // Crimson rejected indicator
          cyan: "#0EA5E9",  // Interactive branding accent
        }
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        // Solid industrial utilitarian shadows
        flat: "4px 4px 0px 0px #0F172A",
        flatAccent: "4px 4px 0px 0px #0EA5E9",
        flatGreen: "4px 4px 0px 0px #10B981",
        flatRose: "4px 4px 0px 0px #EF4444",
      }
    },
  },
  plugins: [],
}
