/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#101a2d',
          dim: '#0f1a2e',
          bright: '#35445a',
          low: '#1a2840',
          container: '#1e2d44',
          high: '#22324a',
          highest: '#2d3d52',
        },
        primary: {
          DEFAULT: '#b9d9ff',
          strong: '#8bbdf0',
          dark: '#5a8fc4',
          light: '#dae8fc',
        },
        secondary: {
          DEFAULT: '#88e0cf',
          teal: '#6ccab8',
        },
        tertiary: {
          DEFAULT: '#d8ccff',
          container: '#c3bce3',
        },
        warm: {
          DEFAULT: '#f2c7a0',
        },
        ink: {
          DEFAULT: '#e6eefc',
          soft: '#c9d3e3',
          muted: '#8d99ab',
        },
        outline: {
          DEFAULT: '#8d99ab',
          variant: '#424f61',
        },
        alert: '#fbbf24',
        critical: '#ffb4ab',
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.06)',
        'glass-strong': 'rgba(255, 255, 255, 0.10)',
        'glass-subtle': 'rgba(255, 255, 255, 0.03)',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.14)',
        'glass-strong': 'rgba(255, 255, 255, 0.22)',
        hairline: 'rgba(255, 255, 255, 0.08)',
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
    },
  },
  plugins: [],
};
