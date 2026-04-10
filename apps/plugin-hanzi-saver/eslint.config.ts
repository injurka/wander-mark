import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  formatters: true,
  ignores: ['bun.lock'],
  rules: {
    'e18e/prefer-static-regex': 'off'
  }
})
