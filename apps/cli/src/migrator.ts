import type { ContentNavItem, ProcessingContext } from './types'
import fs from 'node:fs/promises'
import path from 'node:path'
import { IMAGE_DEST_FOLDER, NAV_FILENAME, TREE_FILENAME } from './constants'
import { buildFileMapRecursive } from './link-resolver'
import { processDirectoryRecursive } from './processor'

export async function main(
  sourceDir: string,
  exportDir: string,
  navigationSysname: string,
  ignoredFolderNames: string[],
  metaRootDir?: string,
): Promise<void> {
  if (!sourceDir || !exportDir || !navigationSysname) {
    throw new Error('Ошибка: Неверные аргументы для migrator.main()')
  }

  const absoluteSourceDir = path.resolve(sourceDir)
  const absoluteExportDir = path.resolve(exportDir)
  const absoluteImageDestPath = path.join(absoluteExportDir, IMAGE_DEST_FOLDER)

  console.log(`--- Инициализация: ${navigationSysname} ---`)

  // Очистка директории контента
  await fs.rm(absoluteExportDir, { recursive: true, force: true }).catch(() => { })
  await fs.mkdir(absoluteExportDir, { recursive: true })
  await fs.mkdir(absoluteImageDestPath, { recursive: true })

  try {
    // 1. Карта ссылок
    const fileMap = new Map<string, string>()
    await buildFileMapRecursive(absoluteSourceDir, absoluteSourceDir, navigationSysname, fileMap, ignoredFolderNames)

    // 2. Инициализация контекста
    const context: ProcessingContext = {
      searchIndex: [],
      graphData: { nodes: [], links: [] },
      backlinks: {},
    }

    // 3. Процессинг
    console.log(`--- Обработка файлов и сбор данных ---`)
    const navigationStructure: ContentNavItem[] = await processDirectoryRecursive(
      absoluteSourceDir,
      absoluteExportDir,
      '',
      absoluteImageDestPath,
      fileMap,
      navigationSysname,
      ignoredFolderNames,
      context,
    )

    // 4. Сохранение nav.json
    const navFilePath = path.join(absoluteExportDir, NAV_FILENAME)
    await fs.writeFile(navFilePath, JSON.stringify(navigationStructure, null, 2), 'utf8')
    console.log(`✅ Навигация сохранена: ${navFilePath}`)

    // 5. Сохранение META данных
    if (metaRootDir) {
      const absoluteMetaRootDir = path.resolve(metaRootDir)

      const vaultFolderName = path.basename(absoluteExportDir)
      const vaultMetaDir = path.join(absoluteMetaRootDir, vaultFolderName)

      await fs.mkdir(vaultMetaDir, { recursive: true })

      await fs.writeFile(path.join(vaultMetaDir, TREE_FILENAME), JSON.stringify(navigationStructure, null, 2), 'utf8')
      await fs.writeFile(path.join(vaultMetaDir, 'search.json'), JSON.stringify(context.searchIndex, null, 2), 'utf8')
      await fs.writeFile(path.join(vaultMetaDir, 'backlinks.json'), JSON.stringify(context.backlinks, null, 2), 'utf8')
      await fs.writeFile(path.join(vaultMetaDir, 'graph.json'), JSON.stringify(context.graphData, null, 2), 'utf8')

      console.log(`🌳 Meta данные сохранены в: ${vaultMetaDir}`)
    }
  }
  catch (error: any) {
    console.error('\n--- КРИТИЧЕСКАЯ ОШИБКА ---')
    console.error(error.message)
    throw error
  }
}
