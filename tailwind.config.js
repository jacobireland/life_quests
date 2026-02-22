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
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          ring: 'var(--color-primary-ring)',
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',
          hover: 'var(--color-destructive-hover)',
        },
        surface: {
          page: 'var(--color-surface-page)',
          card: 'var(--color-surface-card)',
          muted: 'var(--color-surface-muted)',
          subtle: 'var(--color-surface-subtle)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          input: 'var(--color-border-input)',
        },
        foreground: {
          DEFAULT: 'var(--color-foreground)',
          secondary: 'var(--color-foreground-secondary)',
          muted: 'var(--color-foreground-muted)',
          subtle: 'var(--color-foreground-subtle)',
        },
        success: {
          bg: 'var(--color-success-bg)',
          text: 'var(--color-success-text)',
        },
        neutral: {
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          800: 'var(--color-neutral-800)',
        },
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
}
