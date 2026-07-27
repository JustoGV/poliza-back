// @ts-check
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.tsbuildinfo',
      'src/generated/**',
      'prisma/migrations/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript ya resuelve identificadores; `no-undef` sólo da falsos positivos.
      'no-undef': 'off',

      // --- CLAUDE.md: "Nada de `any` — si hace falta, `unknown` + narrowing" ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Las promesas colgadas en un worker de BullMQ se tragan errores en silencio.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      'no-restricted-syntax': [
        'error',
        {
          // CLAUDE.md: "Errores de negocio como clases tipadas que extienden
          // una base común, nunca `throw new Error()`".
          selector: "ThrowStatement > NewExpression[callee.name='Error']",
          message:
            'No lanzar Error genérico. Usar una clase que extienda ErrorDeNegocio (common/errors).',
        },
        {
          // CLAUDE.md: "`$queryRawUnsafe` está prohibido".
          selector: "MemberExpression[property.name='$queryRawUnsafe']",
          message: 'Prohibido: riesgo de inyección SQL. Usar $queryRaw con template tag.',
        },
        {
          // CLAUDE.md: "Montos en Decimal, nunca float".
          selector: "CallExpression[callee.name='parseFloat']",
          message: 'Los montos van en Decimal. Para parsear importes usar el helper de dinero.',
        },
      ],

      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-param-reassign': 'error',

      // NestJS: los decoradores de inyección disparan estas reglas sin que apliquen.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/parameter-properties': 'off',
    },
  },

  // Los tests pueden usar non-null assertion y datos armados a mano.
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-console': 'off',
    },
  },

  // Scripts de build y config corren fuera del programa de tipos.
  {
    files: ['**/*.config.{js,mjs,ts}', '**/*.cjs', '**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: { 'no-console': 'off' },
  },

  prettier,
)
