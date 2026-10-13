/** @type {import('tailwindcss').Config} */
// Replica de src/constants/colors.ts (diseño Aliento). Si cambias uno, cambia el otro.
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  // La app es sólo tema claro; 'class' evita el error de NativeWind en web
  // ("Cannot manually set color scheme") al fijar el esquema desde el sistema.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#F3F4EF',
        surface: { DEFAULT: '#FFFFFF', muted: '#E8EBE3' },
        sage: { DEFAULT: '#DDE6DC', mid: '#9DB5A3', light: '#C3D3C5', pale: '#C9D3C5' },
        peach: { DEFAULT: '#E8A87C', soft: '#F6D2B8', pale: '#FBEBDF' },
        lavender: { pale: '#E6E1F1' },
        forest: '#2F4A3E',
        moss: '#5E7F6E',
        stone: '#8E9C95',
        ink: { DEFAULT: '#1F2A26', soft: '#4C5853', sage: '#3D4944', accent: '#3A2A1F' },
        line: { DEFAULT: '#D5DBD2', divider: '#E1E4DC', soft: '#EDEFE9' },
        danger: { bg: '#F6DCD3', ink: '#7A2E1E', soft: '#5C2A1E', solid: '#E9967A' },
        voice: { bg: '#22302B', surface: '#2E3E38', ring: '#3F4F45', muted: '#B9C6BE' },
      },
      fontFamily: {
        sans: ['Figtree_400Regular'],
        medium: ['Figtree_500Medium'],
        semibold: ['Figtree_600SemiBold'],
        bold: ['Figtree_700Bold'],
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '14px',
        input: '16px',
        lg: '18px',
        card: '22px',
        hero: '28px',
      },
    },
  },
  plugins: [],
};
