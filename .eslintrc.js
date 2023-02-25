module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    mocha: true,
  },
  extends: ["airbnb-base", "prettier"],
  plugins: ["prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "prettier/prettier": ["error"],
    "no-console": "off",
  },
};
