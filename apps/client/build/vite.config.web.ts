import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import { compression as Compression } from 'vite-plugin-compression2'
import { autoImportOptionsCfg } from './cfg/auto-import'
import { iconsCfg } from './cfg/icons'
import { visualizerPlugin } from './lib/helpers'

export default defineConfig({
  base: './',
  root: resolve(__dirname, '../src'),
  publicDir: resolve(__dirname, '../public'),
  envDir: resolve(__dirname, '../../'),

  resolve: {
    alias: {
      '~': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },

  plugins: [
    Vue(),
    AutoImport(autoImportOptionsCfg),
    Compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    Icons(iconsCfg),
    ...visualizerPlugin('renderer'),
  ],

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use '~/assets/scss/_setup.scss' as *;`,
      },
    },
  },

  server: {
    port: 5173,
  },

  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../src/index.html'),
      },
    },
  },
})
