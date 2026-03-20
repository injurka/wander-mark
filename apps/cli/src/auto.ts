import type { ProjectConfig } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { main as runMigrator } from './migrator'

async function copyMetaFiles(config: ProjectConfig) {
  const sourceMetaDir = path.resolve(process.cwd(), config.paths.metaSource)
  const destMetaDir = path.resolve(process.cwd(), config.paths.outputMetaRoot)

  try {
    await fs.access(sourceMetaDir)
    await fs.cp(sourceMetaDir, destMetaDir, { recursive: true, force: true })
    console.log(`📁 Предварительные Meta-данные и иконки скопированы.`)
  }
  catch { /* ignore */ }
}

async function copyPluginsFiles(config: ProjectConfig) {
  if (!config.paths.pluginsSource || !config.paths.outputPluginsRoot)
    return

  const sourceDir = path.resolve(process.cwd(), config.paths.pluginsSource)
  const destDir = path.resolve(process.cwd(), config.paths.outputPluginsRoot)

  try {
    await fs.access(sourceDir)
    await fs.cp(sourceDir, destDir, { recursive: true, force: true })
    console.log(`🧩 Глобальные плагины скопированы.`)
  }
  catch { /* ignore */ }
}

export async function runAutoGeneration(config: ProjectConfig) {
  console.log('🚀 Starting Auto Generation process...')

  const ignoredFolderNames = config.ignore?.folders || []
  const exportPathRoot = path.resolve(process.cwd(), config.paths.outputContentRoot)
  const metaPathRoot = path.resolve(process.cwd(), config.paths.outputMetaRoot)
  const sourceNotesRoot = path.resolve(process.cwd(), config.paths.sourceNotesRoot)

  // 1. Создаем папку контента и копируем статику
  await fs.mkdir(exportPathRoot, { recursive: true })
  await fs.mkdir(metaPathRoot, { recursive: true })

  // 2. Копируем meta-исходники (вместе с вашим оригинальным settings.json)
  await copyMetaFiles(config)
  await copyPluginsFiles(config)

  if (!config.vaults || config.vaults.length === 0) {
    console.log('⚠️ В config.json не указан массив "vaults". Сборка остановлена.')
    return
  }

  for await (const vault of config.vaults) {
    const currentSourcePath = path.join(sourceNotesRoot, vault.sourcePath)
    const exportDirName = vault.exportPath || vault.sourcePath
    const currentExportPath = path.join(exportPathRoot, exportDirName)

    let currentNavSysname = exportDirName

    // 3. Читаем settings.json из уже скопированной папки meta, чтобы достать sysname
    try {
      const settingsPath = path.join(metaPathRoot, exportDirName, 'settings.json')
      const settingsRaw = await fs.readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(settingsRaw)

      if (settings?.info?.sysname) {
        currentNavSysname = settings.info.sysname
      }
    }
    catch {
      console.log(`ℹ️ Файл settings.json для "${exportDirName}" не найден или пуст, используется системное имя папки.`)
    }

    // 4. Запуск мигратора для хранилища
    try {
      await runMigrator(
        currentSourcePath,
        currentExportPath,
        currentNavSysname,
        ignoredFolderNames,
        metaPathRoot,
      )
    }
    catch (e: any) {
      console.warn(`⚠️ SKIP "${currentNavSysname}": ${e.message}\n`)
    }
  }

  console.log(`\n✅ Общая сборка файлов завершена!`)
}
