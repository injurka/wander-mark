#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import externalGlobals from 'rollup-plugin-external-globals'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

const args = process.argv.slice(2)
const watchMode = args.includes('--watch')

const cwd = process.cwd()
const pkgPath = path.join(cwd, 'package.json')

let pluginFileName = 'plugin'
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (pkg.name) {
    pluginFileName = pkg.name.split('/').pop().replace('plugin-', '')
  }
}

console.log(`[WanderMark Builder] Сборка плагина: ${pluginFileName} ${watchMode ? '(Watch Mode)' : ''}`)

async function runBuild() {
  try {
    await build({
      root: cwd,
      configFile: false,
      plugins: [
        vue(),
        cssInjectedByJsPlugin()
      ],
      define: {
        'process.env': {}
      },
      build: {
        watch: watchMode ? {} : null,
        lib: {
          entry: path.resolve(cwd, 'src/index.ts'),
          formats: ['es'],
          fileName: () => `${pluginFileName}.js`
        },
        rollupOptions: {
          external: ['vue'],
          plugins: [
            externalGlobals({
              vue: 'window.Vue'
            })
          ]
        },
        cssCodeSplit: false,
        minify: 'esbuild',
        outDir: path.resolve(cwd, 'dist'),
        emptyOutDir: !watchMode 
      }
    })
  } catch (err) {
    console.error('[WanderMark Builder] Ошибка сборки:', err)
    process.exit(1)
  }
}

runBuild()
