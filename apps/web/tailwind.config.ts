import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        nav: '960px',
      },
      colors: {
        canvas: 'var(--canvas)',
        ground: 'var(--ground)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          soft: 'var(--accent-soft)',
          fg: 'var(--accent-fg)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          fg: 'var(--primary-fg)',
        },
        score: {
          good: 'var(--score-good)',
          warn: 'var(--score-warn)',
          bad: 'var(--score-bad)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        page: ['28px', { lineHeight: '1.15', fontWeight: '800' }],
        section: ['18px', { lineHeight: '1.3', fontWeight: '700' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      boxShadow: {
        rest: '0 1px 2px rgba(15, 21, 18, 0.06)',
        elevate: '0 8px 24px rgba(15, 21, 18, 0.12)',
      },
      ringColor: {
        accent: 'var(--accent)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
