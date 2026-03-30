import { markRaw, reactive, watch } from 'vue'

export interface ReadLog {
  path: string
  title: string
  readDates: number[]
}

export interface ReviewCategories {
  forgotten: ReadLog[]
  due: ReadLog[]
  mastered: ReadLog[]
}

export const trackerState = reactive({
  logs: [] as ReadLog[],
  syncUrl: '',
  lastSync: 0,
  isSyncing: false,

  vaultId: '',
  router: null as any,
  showToast: null as any,
})

export const trackerActions = {
  // ... (init и markAsRead оставляем как были в моем прошлом ответе) ...
  init(ctx: any) {
    trackerState.vaultId = ctx.vaultId
    trackerState.router = markRaw(ctx.router)
    trackerState.showToast = ctx.showToast

    const savedLogs = localStorage.getItem(`wm-tracker-logs-${ctx.vaultId}`)
    if (savedLogs)
      trackerState.logs = JSON.parse(savedLogs)

    const savedConfig = localStorage.getItem(`wm-tracker-cfg-${ctx.vaultId}`)
    if (savedConfig) {
      const cfg = JSON.parse(savedConfig)
      trackerState.syncUrl = cfg.syncUrl || ''
      trackerState.lastSync = cfg.lastSync || 0
    }

    watch(() => trackerState.logs, (val) => {
      localStorage.setItem(`wm-tracker-logs-${ctx.vaultId}`, JSON.stringify(val))
    }, { deep: true })

    watch(() => [trackerState.syncUrl, trackerState.lastSync], () => {
      localStorage.setItem(`wm-tracker-cfg-${ctx.vaultId}`, JSON.stringify({
        syncUrl: trackerState.syncUrl,
        lastSync: trackerState.lastSync,
      }))
    })
  },

  markAsRead(path: string, title: string) {
    const existing = trackerState.logs.find(l => l.path === path)
    const now = Date.now()

    if (existing) {
      const lastRead = existing.readDates.at(-1) ?? 0
      if (now - lastRead > 5000) {
        existing.readDates.push(now)
      }
    }
    else {
      trackerState.logs.push({ path, title, readDates: [now] })
    }

    if (trackerState.showToast) {
      trackerState.showToast('Отмечено как прочитанное!', { type: 'success' })
    }
  },

  getLogByPath(path: string): ReadLog | undefined {
    return trackerState.logs.find(l => l.path === path)
  },

  // НОВЫЙ АЛГОРИТМ ИНТЕРВАЛЬНОГО ПОВТОРЕНИЯ
  getSpacedRepetitionItems(): ReviewCategories {
    const categories: ReviewCategories = { forgotten: [], due: [], mastered: [] }
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // Интервалы в днях для: 1, 2, 3, 4, 5+ прочтений
    const INTERVALS = [1, 3, 7, 14, 30]

    trackerState.logs.forEach((log) => {
      const timesRead = log.readDates.length
      if (timesRead === 0)
        return

      const lastRead = log.readDates.at(-1) ?? 0
      const daysSinceLastRead = (now - lastRead) / ONE_DAY

      // Берем интервал в зависимости от количества чтений
      const targetInterval = INTERVALS[Math.min(timesRead - 1, INTERVALS.length - 1)]

      if (daysSinceLastRead >= targetInterval * 2) {
        // Просрочено более чем в 2 раза
        categories.forgotten.push(log)
      }
      else if (daysSinceLastRead >= targetInterval) {
        // Настало время повторить
        categories.due.push(log)
      }
      else if (timesRead >= 4 && daysSinceLastRead < targetInterval) {
        // Прочитано много раз, и время повторения еще не пришло (твердо в памяти)
        categories.mastered.push(log)
      }
    })

    // Сортировка для максимальной пользы
    categories.forgotten.sort((a, b) => (a.readDates.at(-1) || 0) - (b.readDates.at(-1) || 0)) // Самые старые первыми
    categories.due.sort((a, b) => (a.readDates.at(-1) || 0) - (b.readDates.at(-1) || 0)) // Самые старые первыми
    categories.mastered.sort((a, b) => b.readDates.length - a.readDates.length) // С самым большим счетчиком первыми

    return categories
  },

  async sync() {
    // ... (без изменений, как было)
    if (!trackerState.syncUrl)
      throw new Error('URL не указан')

    trackerState.isSyncing = true
    try {
      const res = await fetch(trackerState.syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId: trackerState.vaultId, logs: trackerState.logs }),
      })

      if (!res.ok)
        throw new Error(`Ошибка сервера: ${res.status}`)

      const remoteLogs: ReadLog[] = await res.json()
      const mergedMap = new Map<string, ReadLog>()

      trackerState.logs.forEach(l => mergedMap.set(l.path, { ...l, readDates: [...l.readDates] }))

      remoteLogs.forEach((rl) => {
        if (mergedMap.has(rl.path)) {
          const local = mergedMap.get(rl.path)!
          local.readDates = Array.from(new Set([...local.readDates, ...rl.readDates])).sort((a, b) => a - b)
          local.title = rl.title || local.title
        }
        else {
          mergedMap.set(rl.path, rl)
        }
      })

      trackerState.logs = Array.from(mergedMap.values())
      trackerState.lastSync = Date.now()

      if (trackerState.showToast)
        trackerState.showToast('Успешно', { type: 'success' })
    }
    catch (e: any) {
      if (trackerState.showToast)
        trackerState.showToast(`Ошибка: ${e.message}`, { type: 'error' })
      throw e
    }
    finally {
      trackerState.isSyncing = false
    }
  },
}
