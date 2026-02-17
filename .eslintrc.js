'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    // ---- 错误预防 ----
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'error',

    // ---- 代码风格 ----
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': ['error', { before: true, after: true }],
    'space-infix-ops': 'error',
    'eqeqeq': ['error', 'always'],

    // ---- Node.js ----
    'handle-callback-err': 'warn',
    'no-process-exit': 'warn'
  },
  overrides: [
    {
      // 测试文件放宽限制
      files: ['**/*.test.js', '**/*.spec.js'],
      env: { jest: true },
      rules: {
        'no-unused-vars': 'off'
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'frontend/Planning-app/'
  ]
};
