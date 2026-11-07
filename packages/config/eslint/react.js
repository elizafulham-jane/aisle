import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.js';

/** ESLint flat config for React (web and React Native) packages. */
export default tseslint.config(...base, {
  plugins: { 'react-hooks': reactHooks },
  languageOptions: {
    globals: { ...globals.browser },
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
  },
});
