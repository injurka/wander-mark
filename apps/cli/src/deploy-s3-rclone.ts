/**
 * S3 deploy via rclone (external binary).
 *
 * @module
 */

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const SLASH_EDGES_REGEX = /^\/+|\/+$/g

async function findNearestEnv(startDir: string): Promise<string | null> {
  let current = startDir
  while (true) {
    const envPath = path.join(current, '.env')
    try {
      await fs.access(envPath)
      return envPath
    }
    catch {
      // not found
    }
    const parent = path.dirname(current)
    if (parent === current)
      return null
    current = parent
  }
}

async function ensureRcloneInstalled(): Promise<void> {
  try {
    await execFileAsync('rclone', ['version'])
  }
  catch {
    throw new Error(
      'rclone не найден в PATH. Установите: sudo pacman -S rclone (Arch) или см. https://rclone.org/install/',
    )
  }
}

/**
 * S3 deploy via the `rclone` external binary.
 *
 * Syncs the output directory to the configured S3 bucket using rclone's sync
 * command. Reads credentials from the same env vars as `runDeployS3`, but
 * delegates the actual transfer to rclone for better performance on large
 * datasets.
 */
export async function runDeployS3Rclone(outputBaseDir: string) {
  const envPath = await findNearestEnv(process.cwd())
  if (envPath) {
    console.log(`-> Переменные окружения загружены из: ${envPath}`)
  }
  else {
    console.log('-> Файл .env не найден, используются текущие переменные окружения')
  }

  const endpoint = process.env.S3_ENDPOINT
  const region = process.env.S3_REGION
  const accessKeyId = process.env.S3_ACCESS_KEY
  const secretAccessKey = process.env.S3_SECRET_KEY
  const bucket = process.env.S3_BUCKET
  // Нормализуем базовый префикс: без ведущих/хвостовых слешей, '' если не задан
  const basePath = (process.env.S3_BASE_PATH || '').replace(SLASH_EDGES_REGEX, '')

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Для S3 деплоя необходимо указать S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET в .env')
  }

  await ensureRcloneInstalled()

  const absoluteOutputDir = path.resolve(process.cwd(), outputBaseDir)

  console.log(`\n🚢 Начинаем деплой в S3 бакет: ${bucket} (rclone)...`)

  const args = [
    'sync',
    absoluteOutputDir,
    `:s3:${bucket}${basePath ? `/${basePath}` : ''}`,
    '--s3-provider',
    'Other',
    '--s3-endpoint',
    endpoint,
    '--s3-access-key-id',
    accessKeyId,
    '--s3-secret-access-key',
    secretAccessKey,
    '--s3-force-path-style',
    '--progress',
    '--exclude',
    'config/**',
  ]

  if (region) {
    args.push('--s3-region', region)
  }

  try {
    const { stdout, stderr } = await execFileAsync('rclone', args, {
      env: { ...process.env },
      maxBuffer: 10 * 1024 * 1024,
    })

    if (stdout)
      console.log(stdout)
    if (stderr)
      console.error(stderr)

    console.log(`✅ Деплой в S3 успешно завершен (rclone)! Бакет: ${bucket}`)
  }
  catch (error: any) {
    console.error('❌ Ошибка во время S3 деплоя (rclone):', error.message)
    throw error
  }
}
