module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "extends": ["eslint:recommended","plugin:react/recommended"],
  "globals": {
    "process": "readonly",
  },
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
    },
    "ecmaVersion": 2018,
    "sourceType": "module",
  },
  "plugins": ["react"],
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "prefer-const": ["error"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
  },
  "settings": {
    "react": {
      "version": "detect",
    },
  },
};
