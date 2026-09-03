#!/usr/bin/env bun

/**
 * Wander Mark CLI — main entrypoint (binary).
 *
 * @module
 */

import path from 'node:path'
import { parseArgs } from 'node:util'
import { runAutoGeneration } from './auto'
import { loadConfig } from './config'
import { runDeploy } from './deploy'
import { runDeployS3 } from './deploy-s3'
import { runDeployS3Rclone } from './deploy-s3-rclone'

async function bootstrap() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      'config': {
        type: 'string',
        short: 'c',
        default: 'config.json',
      },
      'deploy': {
        type: 'boolean',
        short: 'd',
        default: false,
      },
      'deploy-mode': {
        type: 'string',
        short: 'm',
        default: 'static',
      },
      'host': {
        type: 'string',
      },
      'user': {
        type: 'string',
      },
      'path': {
        type: 'string',
      },
      'help': {
        type: 'boolean',
        short: 'h',
        default: false,
      },
    },
  })

  if (values.help) {
    console.log(`
Wander Mark CLI
===================
Использование: bun start [options]

Опции:
  -c, --config <path>  Путь к конфигурационному файлу (по умолчанию: ./config.json)
  -d, --deploy         Выполнить деплой на сервер после сборки
  -m, --deploy-mode    Режим деплоя (static, s3 или s3-rclone, по умолчанию: static)
      --host <ip>      IP или домен сервера для деплоя (переопределяет конфиг, только для static)
      --user <name>    Имя пользователя для SSH (переопределяет конфиг, только для static)
      --path <dir>     Путь на сервере для деплоя (переопределяет конфиг, только для static)
  -h, --help           Показать эту справку
    `)
    process.exit(0)
  }

  try {
    console.log(`📂 Загрузка конфигурации из: ${values.config}`)
    const config = await loadConfig(values.config as string)

    // Шаг 1: Генерация статики
    await runAutoGeneration(config)

    // Шаг 2: Деплой (если передан флаг --deploy)
    if (values.deploy) {
      const mode = values['deploy-mode'] || config.deploy?.mode || 'static'
      const outputDir = path.resolve(config.paths.sourceNotesRoot, '.output')

      if (mode === 's3') {
        await runDeployS3(outputDir)
      }
      else if (mode === 's3-rclone') {
        await runDeployS3Rclone(outputDir)
      }
      else {
        const deployUser = values.user || config.deploy?.user
        const deployHost = values.host || config.deploy?.host
        const deployPath = values.path || config.deploy?.path

        if (!deployUser || !deployHost || !deployPath) {
          throw new Error('Для static деплоя необходимо указать user, host и path либо в config.json, либо через флаги CLI.')
        }

        await runDeploy(deployUser, deployHost, deployPath, outputDir)
      }
    }

    console.log('\n🎉 Все задачи успешно выполнены!')
  }
  catch (error: any) {
    console.error(`\n❌ Fatal Error: ${error.message}`)
    process.exit(1)
  }
}

bootstrap()
