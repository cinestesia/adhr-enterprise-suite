# INIT

Come prima cosa ho installato pnpm:

```bash
    curl -fsSL https://get.pnpm.io/install.sh | sh -
```

poi ho inizializzato il progetto pnpm :

```bash
    pnpm init
```

a queto punto ho creato il file pnpm-workspace.yaml nella root:

```yml
packages:
    - 'apps/*' # Applicazioni eseguibili (Frontend, Backend, ecc.)
    - 'packages/*' # Librerie condivise (UI, Config, DB)
    - 'tooling/*' # Script di automazione, Docker, Helm
```

# TOOL PRICIPALI

```bash
    pnpm add -D turbo prettier typescript eslint husky lint-staged @commitlint/cli @commitlint/config-conventional -w
```

# ESLINT

```bash
    mkdir -p packages/eslint-config
    cd packages/eslint-config
```

e quindi dentro ho creato un package di configurazione :

```json
{
    "name": "@adhr/eslint-config",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "index.js",
    "dependencies": {
        "@eslint/js": "latest",
        "typescript-eslint": "latest"
    }
}
```

sempre nella medesima cartella ho messo il file index.js sempre dentro packages/eslint-config/. Qui ci sono le regole che vuoi che tutte le tue app rispettino (Agile Best Practice 2026):

```js
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
```

e sempre da dentro la medesima cartella ho installato le dipendenze specifiche.

```bash
    pnpm install
```

adesso la nostra root che è a sua volta un package dipende dal pacchetto di configurazione che abbiamo appena creato:

```bash
    pnpm add -D @adhr/eslint-config --workspace -w
```

(Nota: pnpm vedrà che il nome coincide con quello in packages/ e creerà un link simbolico invece di cercarlo su internet).

quindi nella root posso inserire:

```mjs
// eslint.config.mjs
import adhrConfig from '@adhr/eslint-config';

export default [
    {
        // Cose da ignorare globalmente
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.turbo/**',
        ],
    },
    ...adhrConfig, // Qui "spalmiamo" le regole che hai scritto nel pacchetto
];
```

# TYPESCRIPT

per typescript ho seguito la stessa strada. Ho creato un package di configurazione dentro packages. Cioè in packages/typescript-config metto: package.json:

```json
{
    "name": "@adhr/typescript-config",
    "version": "0.0.0",
    "private": true,
    "exports": {
        "./base.json": "./base.json"
    }
}
```

e quindi:

```bash
    pnpm add -D @adhr/typescript-config --workspace -w
```

# PRETTIER

```bash
    mkdir -p packages/prettier-config
```

e allo stesso modo di prima, ho inserito il seguente package.json:

```json
{
    "name": "@adhr/prettier-config",
    "version": "0.0.0",
    "private": true,
    "main": "index.json"
}
```

e in index.json ho messo:

```json
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "endOfLine": "lf"
}
```

e ho aggiunto il link simbolico:

```bash
    pnpm add -D "@adhr/prettier-config" --workspace -w
```

# INIT

Come prima cosa ho installato pnpm:

```bash
    curl -fsSL https://get.pnpm.io/install.sh | sh -
```

poi ho inizializzato il progetto pnpm :

```bash
    pnpm init
```

a queto punto ho creato il file pnpm-workspace.yaml nella root:

```yml
packages:
    - 'apps/*' # Applicazioni eseguibili (Frontend, Backend, ecc.)
    - 'packages/*' # Librerie condivise (UI, Config, DB)
    - 'tooling/*' # Script di automazione, Docker, Helm
```

# TOOL PRICIPALI

```bash
    pnpm add -D turbo prettier typescript eslint husky lint-staged @commitlint/cli @commitlint/config-conventional -w
```

# ESLINT

```bash
    mkdir -p packages/eslint-config
    cd packages/eslint-config
```

e quindi dentro ho creato un package di configurazione :

```json
{
    "name": "@adhr/eslint-config",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "index.js",
    "dependencies": {
        "@eslint/js": "latest",
        "typescript-eslint": "latest"
    }
}
```

sempre nella medesima cartella ho messo il file index.js sempre dentro packages/eslint-config/. Qui ci sono le regole che vuoi che tutte le tue app rispettino (Agile Best Practice 2026):

```js
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
```

e sempre da dentro la medesima cartella ho installato le dipendenze specifiche.

```bash
    pnpm install
```

adesso la nostra root che è a sua volta un package dipende dal pacchetto di configurazione che abbiamo appena creato:

```bash
    pnpm add -D @adhr/eslint-config --workspace -w
```

(Nota: pnpm vedrà che il nome coincide con quello in packages/ e creerà un link simbolico invece di cercarlo su internet).

quindi nella root posso inserire:

```mjs
// eslint.config.mjs
import adhrConfig from '@adhr/eslint-config';

export default [
    {
        // Cose da ignorare globalmente
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.turbo/**',
        ],
    },
    ...adhrConfig, // Qui "spalmiamo" le regole che hai scritto nel pacchetto
];
```

# TYPESCRIPT

per typescript ho seguito la stessa strada. Ho creato un package di configurazione dentro packages. Cioè in packages/typescript-config metto: package.json:

```json
{
    "name": "@adhr/typescript-config",
    "version": "0.0.0",
    "private": true,
    "exports": {
        "./base.json": "./base.json"
    }
}
```

e quindi:

```bash
    pnpm add -D @adhr/typescript-config --workspace -w
```

# PRETTIER

```bash
    mkdir -p packages/prettier-config
```

e allo stesso modo di prima, ho inserito il seguente package.json:

```json
{
    "name": "@adhr/prettier-config",
    "version": "0.0.0",
    "private": true,
    "main": "index.json"
}
```

e in index.json ho messo:

```json
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "endOfLine": "lf"
}
```

e ho aggiunto il link simbolico:

```bash
    pnpm add -D @adhr/prettier-config--workspace -w
```

inoltre in root ho messo: .prettierrc.json con:

```json
"@adhr/prettier-config"
```

# HUSKY

Come abbiamo visto prima ho installato HUSKY. Adesso lo devo inizializzare in modo da agganciarsi al pre commit:

```bash
    git init
    pnpm exec husky init
```

poi in package.json della root ho aggiunto:

```json
    "lint-staged": {
        "*.{js,ts,tsx}": [
            "eslint --fix",
            "prettier --write"
        ],
        "*.{json,md,yml}": [
            "prettier --write"
        ]
    }
```

# Avvio 
Come prima cosa andiamo ad avviare minikube:

```bash 
    minikube start
```

una volta avviato minikube dobbiamo creare il build delle immagini:

```bash 
# reset docker: comincio da capo
docker system prune -a --volumes

# Build Backend
docker build -t onboarding-backend:dev -f apps/onboarding-backend/Dockerfile .

# Build Frontend
docker build -t onboarding-frontend:dev -f apps/onboarding-frontend/Dockerfile .
``` 