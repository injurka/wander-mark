// Контракты типизированного обмена между Main Thread и SQLite Worker'ом (birpc)

export interface TextFilePayload {
  path: string
  content: string
  lastModified?: number
}

export interface SearchResultItem {
  path: string
  title: string
  tags: string
  snippet: string
  rank: number
}

/** Функции, реализуемые воркером (вызываются из Main Thread) */
export interface DbWorkerFunctions {
  /** Инициализация БД и схемы */
  initDb: () => Promise<void>
  /** Транзакционная запись батча текстовых файлов (.md/.json) + обновление FTS-индекса */
  syncTextBatch: (vaultId: string, files: TextFilePayload[]) => Promise<void>
  /** Прямая запись бинарника в OPFS (минуя SQLite) */
  writeMedia: (vaultId: string, path: string, data: ArrayBuffer) => Promise<void>
  /** Чтение текстового контента из SQLite */
  getFile: (vaultId: string, path: string) => Promise<string | null>
  /** Удаление одного файла */
  deleteFile: (vaultId: string, path: string) => Promise<void>
  /** Полнотекстовый поиск по FTS5 */
  searchFTS: (query: string, vaultId: string) => Promise<SearchResultItem[]>
  /** Каскадное удаление всех данных хранилища (SQLite + OPFS) */
  deleteVault: (vaultId: string) => Promise<void>
}

/** Функции, реализуемые Main Thread'ом (вызываются из воркера) */
export interface MainThreadFunctions {
  /** Пуш прогресса синхронизации прямо из воркера в UI */
  onSyncProgress: (vaultId: string, progress: number) => void
}
