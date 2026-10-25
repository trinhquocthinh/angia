import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import { configs as tsConfigs } from 'typescript-eslint';

const APPS = ['api', 'web', 'worker'];
const feature = (app, layer) => `./apps/${app}/src/features/*/${layer}/**/*`;

// Clean Architecture (05-tech-spec §2.1): Presentation → Application → Domain; Infrastructure hiện thực Ports.
const layerZones = APPS.flatMap((app) => [
  {
    target: feature(app, 'domain'),
    from: [feature(app, 'application'), feature(app, 'infrastructure'), feature(app, 'presentation')],
    message: 'Domain là hạt nhân thuần, không được import tầng khác.',
  },
  {
    target: feature(app, 'application'),
    from: [feature(app, 'infrastructure'), feature(app, 'presentation')],
    message: 'Application chỉ phụ thuộc Domain và Ports; không import Infrastructure/Presentation.',
  },
  {
    target: feature(app, 'infrastructure'),
    from: [feature(app, 'presentation')],
    message: 'Infrastructure không được phụ thuộc Presentation.',
  },
]);

const crossAppZones = APPS.map((app) => ({
  target: `./apps/${app}/**/*`,
  from: APPS.filter((other) => other !== app).map((other) => `./apps/${other}/**/*`),
  message: 'Các app chỉ chia sẻ mã qua packages/contracts.',
}));

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/coverage/**', '.yarn/**', 'design/**', '**/*.gen.ts'],
  },
  js.configs.recommended,
  tsConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: { globals: { ...globals.node }, ecmaVersion: 'latest', sourceType: 'module' },
    settings: {
      'import/resolver': {
        // Mỗi workspace có alias @src riêng: resolver chọn tsconfig chứa file đang lint.
        typescript: {
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
        node: true,
      },
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: [...layerZones, ...crossAppZones] }],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Domain chỉ là TypeScript thuần: cấm mọi package bên ngoài (Drizzle, Hono, React, Zod...).
    files: ['apps/*/src/features/*/domain/**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.{1,2}/|@src/)',
              message: 'Domain không được import package bên ngoài.',
            },
          ],
        },
      ],
    },
  },
  {
    // index.ts chỉ được re-export, không chứa logic.
    files: ['**/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > :not(ExportAllDeclaration, ExportNamedDeclaration[source])',
          message: 'index.ts chỉ được phép re-export (export ... from).',
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: { 'max-lines-per-function': 'off' },
  },
  prettier,
);
