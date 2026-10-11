const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Absolute, forward-slash globs: work from any working directory, on Windows too.
  content: [path.join(__dirname, 'index.html'), path.join(__dirname, 'src/**/*.{ts,tsx}')].map((p) => p.replace(/\\/g, '/')),
  theme: {
    extend: {
      colors: {
        // Neutral blacks (very slightly warm).
        ink: {
          950: '#060607',
          900: '#0a0a0c',
          850: '#0e0f11',
          800: '#131417',
          700: '#1a1b1f',
          600: '#25272c',
        },
        line: 'rgba(240, 236, 228, 0.09)',
        // Warm whites and greys.
        fog: {
          100: '#f4f1ea',
          300: '#cbc7be',
          500: '#93908a',
          700: '#5f5d59',
        },
        // Pittsburgh gold: the single accent.
        gold: {
          DEFAULT: '#f2b530',
          soft: '#ffd978',
          deep: '#d99a1e',
        },
        // Status only (live dots, agent eyes).
        live: '#5eead4',
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Labels use the same DIN-style face, uppercase and tracked.
        mono: ['Barlow', 'system-ui', 'sans-serif'],
        code: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        shell: '1240px',
      },
    },
  },
  plugins: [],
};
