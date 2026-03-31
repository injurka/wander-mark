import vue from '@vitejs/plugin-vue'
import externalGlobals from 'rollup-plugin-external-globals'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [
    vue(),
    cssInjectedByJsPlugin(),
  ],

  define: {
    'process.env': {},
  },

  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'smart-textbook',
    },
    rollupOptions: {
      external: ['vue'],
      plugins: [
        externalGlobals({
          vue: 'window.Vue',
        }),
      ],
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    outDir: 'dist',
  },
})
