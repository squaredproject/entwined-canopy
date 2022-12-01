module.exports = {
  env: {
    node: true,
  },

  parserOptions: {
    parser: '@babel/eslint-parser',
  },

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off',
  },

  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
  ],
}
