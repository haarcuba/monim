import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier/recommended';

export default defineConfig([
    globalIgnores(['dist', 'coverage']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            prettier,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            complexity: ['error', 8],
            'max-lines-per-function': ['error', 80],
            'max-lines': ['error', 150],
        },
    },
]);
