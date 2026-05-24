/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        safenet: {
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          'surface-2': '#F1F5F9',
          primary: '#0F7B4D',
          'primary-light': '#DCFCE7',
          'primary-dark': '#064E30',
          accent: '#F59E0B',
          'accent-light': '#FEF9EE',
          text: '#0F172A',
          'text-2': '#475569',
          'text-3': '#94A3B8',
          danger: '#DC2626',
          'danger-light': '#FEF2F2',
          border: '#E2E8F0',
          'border-strong': '#CBD5E1',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        'display-bold': ['Newsreader', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        display: ['80px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-lg': ['64px', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-md': ['52px', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-sm': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-lg': ['32px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-md': ['26px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-sm': ['22px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      borderRadius: {
        input: '6px',
        btn: '8px',
        card: '12px',
        'card-lg': '16px',
        hero: '24px',
      },
      boxShadow: {
        'safenet-sm': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'safenet-md': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        'safenet-lg': '0 10px 25px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.03)',
        'safenet-xl': '0 25px 50px rgba(0,0,0,0.10)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
    },
  },
  plugins: [],
}
