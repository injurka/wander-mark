import type { ProjectConfig } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { main as runMigrator } from './migrator'

async function copyMetaFiles(config: ProjectConfig) {
  const sourceMetaDir = path.resolve(process.cwd(), config.paths.metaSource)
  const destMetaDir = path.resolve(process.cwd(), config.paths.outputMetaRoot)

  try {
    // Рекурсивно копируем заранее заготовленную структуру meta (включая images/icon.png)
    await fs.access(sourceMetaDir)
    await fs.cp(sourceMetaDir, destMetaDir, { recursive: true, force: true })
    console.log(`📁 Предварительные Meta-данные и иконки скопированы.`)
  }
  catch (e: any) { /* ignore */ }
}

export async function runAutoGeneration(config: ProjectConfig) {
  console.log('🚀 Starting Auto Generation process...')

  const sourceDataFilePath = path.resolve(process.cwd(), config.paths.sourceDataFile)
  const outputMdJsonRaw = await fs.readFile(sourceDataFilePath, 'utf-8')
  const outputMdJson = JSON.parse(outputMdJsonRaw)

  const ignoredFolderNames = config.ignore.folders
  const exportPathRoot = path.resolve(process.cwd(), config.paths.outputContentRoot)
  const metaPathRoot = path.resolve(process.cwd(), config.paths.outputMetaRoot)
  const sourceNotesRoot = path.resolve(process.cwd(), config.paths.sourceNotesRoot)

  const filteredOutputMdJson = outputMdJson.filter((item: any) => {
    return !ignoredFolderNames.includes(path.basename(item.sourcePath))
  })

  // 1. Создаем папку контента и копируем заранее подготовленные файлы метаданных (в т.ч. иконки)
  await fs.mkdir(exportPathRoot, { recursive: true })
  await fs.mkdir(metaPathRoot, { recursive: true })
  await copyMetaFiles(config)

  for await (const item of filteredOutputMdJson) {
    const currentSourcePath = path.join(sourceNotesRoot, item.sourcePath)
    const currentExportPath = path.join(exportPathRoot, item.exportPath)
    const currentNavSysname = item.navigation.sysname

    try {
      // 2. Обработка Markdown и генерация graph.json, tree.json и т.д.
      await runMigrator(
        currentSourcePath,
        currentExportPath,
        currentNavSysname,
        ignoredFolderNames,
        metaPathRoot,
      )

      const vaultMetaDir = path.join(metaPathRoot, currentNavSysname)
      await fs.mkdir(vaultMetaDir, { recursive: true })

      // 3. Формируем settings.json, удаляя устаревшее поле icon
      const navInfo = { ...item.navigation }
      if ('icon' in navInfo) {
        delete navInfo.icon
      }

      const settingsPath = path.join(vaultMetaDir, 'settings.json')
      await fs.writeFile(settingsPath, JSON.stringify({ info: navInfo }, null, 2))
      console.log(`📝 Settings saved: meta/${currentNavSysname}/settings.json`)
    }
    catch (e: any) {
      console.warn(`⚠️ SKIP "${currentNavSysname}": ${e.message}\n`)
    }
  }

  console.log(`\n✅ Общая сборка файлов завершена!`)
}
