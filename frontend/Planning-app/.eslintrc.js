/**
 * ESLint 配置 - UniApp 前端项目
 *
 * 目标:
 * - 防止重复声明(函数、变量)
 * - 统一代码风格
 * - 提前发现潜在Bug
 *
 * 使用方式:
 *   检查所有文件: npx eslint@8 pages/ --ext .vue,.js
 *   自动修复:     npx eslint@8 pages/ --ext .vue,.js --fix
 *   检查单个文件: npx eslint@8 pages/calendar/index.vue
 *
 * @date 2026-03-04
 */

module.exports = {
  root: true,

  env: {
    browser: true,      // 浏览器全局变量(window, document 等)
    es2021: true,       // ES2021 语法支持
    node: false         // 前端不使用 Node.js API
  },

  // UniApp 全局变量
  globals: {
    uni: 'readonly',           // UniApp API
    wx: 'readonly',            // 微信小程序 API
    plus: 'readonly',          // App 增强 API
    getCurrentPages: 'readonly',
    getApp: 'readonly',
    getRegExp: 'readonly',
    __wxConfig: 'readonly'
  },

  // 基础规则集
  extends: [
    'eslint:recommended'
  ],

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },

  rules: {
    // ==================== 🔴 P0 - 严重Bug预防 ====================

    /**
     * 禁止重复声明变量和函数
     * 🔴 P0 - 这是本次配置的核心目标
     */
    'no-redeclare': 'error',

    /**
     * 禁止重新赋值函数声明
     */
    'no-func-assign': 'error',

    /**
     * 禁止对象字面量中出现重复的键
     */
    'no-dupe-keys': 'error',

    /**
     * 禁止重复的 case 标签
     */
    'no-duplicate-case': 'error',

    /**
     * 禁止重复的类成员
     */
    'no-dupe-class-members': 'error',

    /**
     * 警告变量阴影(内层作用域变量覆盖外层)
     */
    'no-shadow': ['warn', {
      builtinGlobals: false,
      hoist: 'functions',
      allow: []
    }],

    /**
     * 禁止在条件中使用常量表达式(可能是笔误)
     */
    'no-constant-condition': ['error', { checkLoops: false }],

    /**
     * 禁止在 return、throw、continue 和 break 语句后出现不可达代码
     */
    'no-unreachable': 'error',

    // ==================== 🟡 P1 - 代码质量 ====================

    /**
     * 推荐使用 const 声明不会重新赋值的变量
     */
    'prefer-const': ['warn', {
      destructuring: 'any',
      ignoreReadBeforeAssign: false
    }],

    /**
     * 未使用的变量(警告级别)
     * 允许下划线开头的参数(约定俗成表示"未使用")
     */
    'no-unused-vars': ['warn', {
      vars: 'all',
      args: 'after-used',
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'all'
    }],

    /**
     * 禁止使用未声明的变量
     */
    'no-undef': 'error',

    /**
     * 要求使用 === 和 !==
     */
    'eqeqeq': ['error', 'always', { null: 'ignore' }],

    /**
     * 禁止使用 var(使用 let/const)
     */
    'no-var': 'error',

    // ==================== 🟢 P2 - 代码风格 ====================

    /**
     * 分号
     */
    'semi': ['error', 'always'],

    /**
     * 引号(单引号,允许转义)
     */
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

    /**
     * 缩进(2空格)
     */
    'indent': ['error', 2, { SwitchCase: 1 }],

    /**
     * 文件末尾换行
     */
    'eol-last': ['error', 'always'],

    /**
     * 禁止行尾空格
     */
    'no-trailing-spaces': 'error',

    /**
     * 逗号不要尾随
     */
    'comma-dangle': ['error', 'never'],

    /**
     * 对象花括号内空格
     */
    'object-curly-spacing': ['error', 'always'],

    /**
     * 数组方括号内不要空格
     */
    'array-bracket-spacing': ['error', 'never'],

    /**
     * 函数名和括号之间不要空格
     */
    'space-before-function-paren': ['error', 'never'],

    /**
     * 关键字前后要有空格
     */
    'keyword-spacing': ['error', { before: true, after: true }],

    /**
     * 操作符周围要有空格
     */
    'space-infix-ops': 'error',

    /**
     * 箭头函数箭头前后要有空格
     */
    'arrow-spacing': ['error', { before: true, after: true }],

    // ==================== 生产环境规则 ====================

    /**
     * console(开发环境允许,生产环境警告)
     */
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    /**
     * debugger(开发环境允许,生产环境禁止)
     */
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },

  // ==================== 忽略模式 ====================

  ignorePatterns: [
    'node_modules/',
    'unpackage/',
    'dist/',
    '.hbuilderx/',
    '*.config.js'
  ]
};
