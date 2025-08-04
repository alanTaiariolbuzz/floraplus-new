module.exports = {
  plugins: {
    'postcss-flexbugs-fixes': {},
    tailwindcss: {},
    autoprefixer: {
      flexbox: 'no-2009',
    },
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'custom-properties': false,
      },
    },
  },
};
