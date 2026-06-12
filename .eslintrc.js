module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  ignorePatterns: [
    "w-gl/*.js"
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 1,
    'no-mixed-spaces-and-tabs': 0,
    // `model` is a shared mutable store object passed into CodeEditor by
    // reference; both parent and child intentionally read/write its props.
    'vue/no-mutating-props': 0
  }
}
