module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
  ],
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.ts', '**/*.test.jsx', '**/*.test.tsx', '**/*.spec.js', '**/*.spec.ts', '**/*.spec.jsx', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'coverage/',
    '*.min.js',
    'src/types/*.d.ts',
  ],
};