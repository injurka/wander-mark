/**
 * S3 deploy via `@aws-sdk/client-s3`.
 *
 * @module
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const WINDOWS_SLASH_REGEX = /\\/g
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

/**
 * S3 bulk upload deploy.
 *
 * Walks the output directory recursively and uploads every file to the S3
 * bucket configured in environment variables (`S3_ENDPOINT`, `S3_ACCESS_KEY`,
 * `S3_SECRET_KEY`, `S3_BUCKET`). Sets Content-Type based on file extension.
 */
export async function runDeployS3(outputBaseDir: string) {
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

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })

  const absoluteOutputDir = path.resolve(process.cwd(), outputBaseDir)

  async function walk(dir: string): Promise<string[]> {
    let files: string[] = []
    const list = await fs.readdir(dir, { withFileTypes: true })
    for (const file of list) {
      if (file.isDirectory()) {
        files = [...files, ...await walk(path.join(dir, file.name))]
      }
      else {
        files.push(path.join(dir, file.name))
      }
    }
    return files
  }

  console.log(`\n🚢 Начинаем деплой в S3 бакет: ${bucket}...`)

  try {
    const allFiles = await walk(absoluteOutputDir)
    console.log(`-> Найдено файлов для загрузки: ${allFiles.length}`)

    let uploaded = 0
    for (const filePath of allFiles) {
      // Ключ - это относительный путь от absoluteOutputDir (с прямыми слешами)
      const key = path.relative(absoluteOutputDir, filePath).replace(WINDOWS_SLASH_REGEX, '/')
      const fileContent = await fs.readFile(filePath)

      const ext = path.extname(filePath).toLowerCase()
      let contentType = 'application/octet-stream'
      if (ext === '.json')
        contentType = 'application/json'
      else if (ext === '.md')
        contentType = 'text/markdown'
      else if (ext === '.png')
        contentType = 'image/png'
      else if (ext === '.jpg' || ext === '.jpeg')
        contentType = 'image/jpeg'
      else if (ext === '.svg')
        contentType = 'image/svg+xml'
      else if (ext === '.html')
        contentType = 'text/html'
      else if (ext === '.css')
        contentType = 'text/css'
      else if (ext === '.js')
        contentType = 'application/javascript'

      // Sanitize key: replace spaces with hyphens, collapse multiple hyphens
      // eslint-disable-next-line e18e/prefer-static-regex
      const sanitizedKey = [basePath, key.replace(/\s+/g, '-').replace(/-+/g, '-')].filter(Boolean).join('/')

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: sanitizedKey,
        Body: fileContent,
        ContentType: contentType,
      }))

      uploaded++
      if (uploaded % 50 === 0) {
        console.log(`-> Загружено ${uploaded}/${allFiles.length}...`)
      }
    }

    console.log(`✅ Деплой в S3 успешно завершен! Загружено файлов: ${uploaded}`)
  }
  catch (error: any) {
    console.error('❌ Ошибка во время S3 деплоя:', error.message)
    throw error
  }
}
