import type { ProjectConfig } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function loadConfig(configPath: string): Promise<ProjectConfig> {
  const resolvedPath = path.resolve(process.cwd(), configPath)

  try {
    const fileContent = await fs.readFile(resolvedPath, 'utf-8')
    const config = JSON.parse(fileContent) as ProjectConfig
    return config
  }
  catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Конфигурационный файл не найден по пути: ${resolvedPath}`)
    }
    throw new Error(`Ошибка чтения конфигурации: ${error.message}`)
  }
}
