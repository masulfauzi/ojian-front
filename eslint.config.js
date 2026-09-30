import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'],
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },

  {
    name: 'app/node-config-files',
    files: ['*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    name: 'app/rules',
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      // v-html hanya dipakai di RichTextViewer setelah disanitasi DOMPurify.
      'vue/no-v-html': 'off',
    },
  },

  {
    // Aturan arsitektur: `shared/` tidak boleh bergantung pada `modules/`.
    name: 'app/shared-boundary',
    files: ['src/shared/**/*.{js,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*', '@/app/*'],
              message: 'shared/ tidak boleh mengimpor dari modules/ atau app/.',
            },
          ],
        },
      ],
    },
  },

  {
    // Aturan arsitektur: modul lain hanya boleh diimpor lewat public API-nya (index.js).
    name: 'app/module-boundary',
    files: ['src/modules/**/*.{js,vue}', 'src/app/**/*.{js,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/*'],
              message: 'Impor modul lain lewat @/modules/<nama> (index.js).',
            },
          ],
        },
      ],
    },
  },

  skipFormatting,
]
