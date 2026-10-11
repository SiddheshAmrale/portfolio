/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space neutrals.
        ink: {
          950: '#04050a',
          900: '#070910',
          850: '#0a0d16',
          800: '#0e121d',
          700: '#151a28',
          600: '#1f2638',
        },
        line: 'rgba(148, 163, 196, 0.12)',
        fog: {
          100: '#eef1f8',
          300: '#c4cad8',
          500: '#8b93a7',
          700: '#5b6377',
        },
        // Signal accents: cyan -> indigo -> violet, one warm highlight.
        signal: {
          cyan: '#5eead4',
          sky: '#7dd3fc',
          indigo: '#818cf8',
          violet: '#c084fc',
          amber: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        shell: '1240px',
      },
    },
  },
  plugins: [],
};
