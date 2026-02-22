/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Background */
        background: 'var(--color-background)',
        'background-text': 'var(--color-background-text)',
        /* Foreground (cards, panels); all text variants = foreground-text */
        foreground: {
          DEFAULT: 'var(--color-foreground-text)',
          surface: 'var(--color-foreground)',
          text: 'var(--color-foreground-text)',
          'text-hover': 'var(--color-foreground-text-hover)',
          secondary: 'var(--color-foreground-text)',
          muted: 'var(--color-foreground-text)',
          subtle: 'var(--color-foreground-text)',
        },
        /* Accent */
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        tertiary: 'var(--color-tertiary)',
        /* Miscellaneous */
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          hover: 'var(--color-destructive-hover)',
        },
        /* Aliases so existing classes still work */
        surface: {
          page: 'var(--color-background)',
          card: 'var(--color-foreground)',
          muted: 'var(--color-foreground)',
          subtle: 'var(--color-tertiary)',
        },
        border: 'var(--color-tertiary)',
        neutral: {
          200: 'var(--color-tertiary)',
          300: 'var(--color-tertiary)',
          400: 'var(--color-tertiary)',
          800: 'var(--color-foreground-text)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
}
