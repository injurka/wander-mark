import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  formatters: true,
  rules: {
    'e18e/prefer-static-regex': 'off',
  },
  ignores: [
    '**/dist-tauri/**',
    '**/assets/**',
    '**/public/**',
    'auto-imports.d.ts',
    'bun.lock',
  ],
})
