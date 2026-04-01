import type { ProjectConfig } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { main as runMigrator } from './migrator'

async function copyVaultMetaFiles(config: ProjectConfig, sourcePath: string, exportDirName: string) {
  const sourceMetaRoot = path.resolve(process.cwd(), config.paths.metaSource)
  const destMetaRoot = path.resolve(process.cwd(), config.paths.outputMetaRoot)

  const destMetaDir = path.join(destMetaRoot, exportDirName)
  const sourceBasename = path.basename(sourcePath)

  const possibleSources = [
    path.join(sourceMetaRoot, exportDirName),
    path.join(sourceMetaRoot, sourceBasename),
  ]

  for (const src of possibleSources) {
    try {
      const stat = await fs.stat(src)
      if (stat.isDirectory()) {
        await fs.cp(src, destMetaDir, { recursive: true, force: true })
        console.log(`📁 Meta-данные для "${exportDirName}" успешно скопированы.`)
        return
      }
    }
    catch { /* ignore */ }
  }
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

  // 1. ПОЛНАЯ ОЧИСТКА перед сборкой (удаляем старые фантомные папки вроде Russian-CN)
  await fs.rm(exportPathRoot, { recursive: true, force: true }).catch(() => { })
  await fs.rm(metaPathRoot, { recursive: true, force: true }).catch(() => { })
  await fs.mkdir(exportPathRoot, { recursive: true })
  await fs.mkdir(metaPathRoot, { recursive: true })

  // 2. Копируем глобальные плагины
  await copyPluginsFiles(config)

  if (!config.vaults || config.vaults.length === 0) {
    console.log('⚠️ В config.json не указан массив "vaults". Сборка остановлена.')
    return
  }

  for await (const vault of config.vaults) {
    const currentSourcePath = path.join(sourceNotesRoot, vault.sourcePath)

    // Надежно определяем имя папки (убираем начальные слэши, если они есть, например /Russian -> Russian)
    let exportDirName = vault.exportPath || path.basename(vault.sourcePath)
    exportDirName = exportDirName.replace(/^\/+/, '')

    const currentExportPath = path.join(exportPathRoot, exportDirName)

    // 3. Адресно копируем meta-исходники для конкретного хранилища
    await copyVaultMetaFiles(config, vault.sourcePath, exportDirName)

    let currentNavSysname = exportDirName

    // 4. Читаем settings.json, чтобы достать sysname для правильных URL ссылок
    try {
      const settingsPath = path.join(metaPathRoot, exportDirName, 'settings.json')
      const settingsRaw = await fs.readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(settingsRaw)

      if (settings?.info?.sysname) {
        currentNavSysname = settings.info.sysname
      }
    }
    catch {
      console.log(`ℹ️ Файл settings.json для "${exportDirName}" не найден, используется имя папки.`)
    }

    // 5. Запуск мигратора для хранилища
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
