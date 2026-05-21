const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {
      overrideBrowserslist: [
        "chrome >= 109",
        "firefox >= 110",
        "safari >= 16",
        "edge >= 109",
      ],
    },
  },
};

export default config;
