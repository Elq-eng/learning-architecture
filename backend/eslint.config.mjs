import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'tests/architecture/fixtures'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // NestJS modules are empty decorated classes.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    // The domain receives time and randomness through ports (AGENTS.md §3.1).
    files: ['src/*/domain/**/*.ts', 'src/shared-kernel/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Inject a Clock port instead of reading the system time.' },
        { name: 'crypto', message: 'Inject an IdGenerator port instead of generating ids.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Inject randomness through a port.' },
      ],
    },
  },
);
