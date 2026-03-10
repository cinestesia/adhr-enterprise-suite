import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            'no-console': 'warn',
            semi: ['error', 'always'],
            quotes: ['error', 'single'],
        },
    },
];
