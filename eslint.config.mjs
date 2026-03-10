import adhrConfig from './packages/eslint-config/index.js';

export default [
    {
        // Aggiungi commitlint.config.js agli ignorati
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
            'commitlint.config.js', // <--- Aggiungi questo!
        ],
    },
    ...adhrConfig,
];
