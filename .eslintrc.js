/**
 * WhatsSound — ESLint Configuration
 * Configuración progresiva: empezamos con warnings, no errors
 */

module.exports = {
  root: true,
  extends: [
    'expo',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    // TypeScript - warnings por ahora, errors después
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-empty-function': 'warn',
    
    // React
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    
    // General - warnings
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    
    // Expo specific
    'import/no-unresolved': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'web-build/',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
