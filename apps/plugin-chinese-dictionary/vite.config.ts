import vue from '@vitejs/plugin-vue'
import externalGlobals from 'rollup-plugin-external-globals'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],

  define: {
    'process.env': {},
  },

  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'chinese-dictionary',
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
