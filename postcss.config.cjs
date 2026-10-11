const path = require('path');

// Paths are anchored to this folder so the build works from any working directory.
module.exports = {
  plugins: {
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.cjs') },
    autoprefixer: {},
  },
};
