import { get, set } from 'idb-keyval'
import { markRaw, reactive, watch } from 'vue'

export interface ReadLogVisit {
  timestamp: number
  duration: number
}

export interface ReadLog {
  path: string
  title: string
  readDates: number[]
  visits: ReadLogVisit[]
}

export interface ReviewCategories {
  forgotten: ReadLog[]
  due: ReadLog[]
  mastered: ReadLog[]
}

export const trackerState = reactive({
  logs: [] as ReadLog[],
  syncUrl: '',
  identifier: '',
  lastSync: 0,
  isSyncing: false,
  scope: '', 

  vaultId: '',
  vaultUrl: '',
  router: null as any,
  showToast: null as any,
  getFileContent: null as any,
})

export const trackerActions = {
  init(ctx: any) {
    trackerState.vaultId = ctx.vaultId
    trackerState.vaultUrl = ctx.vaultUrl
    trackerState.router = markRaw(ctx.router)
    trackerState.showToast = ctx.showToast
    trackerState.getFileContent = ctx.getFileContent

    // Загрузка логов из IndexedDB
    get(`wm-tracker-logs-${ctx.vaultId}`).then((savedLogs) => {
      if (savedLogs && Array.isArray(savedLogs)) {
        trackerState.logs = savedLogs.map(log => ({
          ...log,
          visits: log.visits || log.readDates.map((ts: number) => ({ timestamp: ts, duration: 60 }))
        }))
      }
    })

    // Загрузка настроек из localStorage
    const savedConfig = localStorage.getItem(`wm-tracker-cfg-${ctx.vaultId}`)
    if (savedConfig) {
      const cfg = JSON.parse(savedConfig)
      trackerState.syncUrl = cfg.syncUrl || ''
      trackerState.identifier = cfg.identifier || ''
      trackerState.lastSync = cfg.lastSync || 0
      trackerState.scope = cfg.scope || ''
    }

    // Сохранение логов в IndexedDB при изменении
    watch(() => trackerState.logs, (val) => {
      set(`wm-tracker-logs-${ctx.vaultId}`, JSON.parse(JSON.stringify(val)))
    }, { deep: true })

    // Сохранение настроек в localStorage при изменении
    watch(() => [trackerState.syncUrl, trackerState.identifier, trackerState.lastSync, trackerState.scope], () => {
      localStorage.setItem(`wm-tracker-cfg-${ctx.vaultId}`, JSON.stringify({
        syncUrl: trackerState.syncUrl,
        identifier: trackerState.identifier,
        lastSync: trackerState.lastSync,
        scope: trackerState.scope,
      }))
    })
  },

  setScope(scope: string) {
    trackerState.scope = scope
  },

  getFilteredLogs() {
    if (!trackerState.scope) return trackerState.logs
    return trackerState.logs.filter(l => l.path.startsWith(trackerState.scope))
  },

  addVisit(path: string, title: string, duration: number) {
    const existing = trackerState.logs.find(l => l.path === path)
    const now = Date.now()

    if (existing) {
      existing.visits.push({ timestamp: now, duration })
      existing.readDates.push(now)
    }
    else {
      trackerState.logs.push({ path, title, readDates: [now], visits: [{ timestamp: now, duration }] })
    }
  },

  markAsRead(path: string, title: string) {
    this.addVisit(path, title, 60)
    if (trackerState.showToast) {
      trackerState.showToast('Отмечено как прочитанное!', { type: 'success' })
    }
  },

  getLogByPath(path: string): ReadLog | undefined {
    return trackerState.logs.find(l => l.path === path)
  },

  getSpacedRepetitionItems(): ReviewCategories {
    const categories: ReviewCategories = { forgotten: [], due: [], mastered: [] }
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    const INTERVALS = [1, 3, 7, 14, 30]
    const logs = this.getFilteredLogs()

    logs.forEach((log) => {
      const timesRead = log.visits.length
      if (timesRead === 0)
        return

      const lastRead = log.visits.at(-1)?.timestamp ?? 0
      const daysSinceLastRead = (now - lastRead) / ONE_DAY
      const targetInterval = INTERVALS[Math.min(timesRead - 1, INTERVALS.length - 1)]

      if (daysSinceLastRead >= targetInterval * 2) {
        categories.forgotten.push(log)
      }
      else if (daysSinceLastRead >= targetInterval) {
        categories.due.push(log)
      }
      else if (timesRead >= 4 && daysSinceLastRead < targetInterval) {
        categories.mastered.push(log)
      }
    })

    categories.forgotten.sort((a, b) => (a.visits.at(-1)?.timestamp || 0) - (b.visits.at(-1)?.timestamp || 0))
    categories.due.sort((a, b) => (a.visits.at(-1)?.timestamp || 0) - (b.visits.at(-1)?.timestamp || 0))
    categories.mastered.sort((a, b) => b.visits.length - a.visits.length)

    return categories
  },

  async sync() {
    if (!trackerState.syncUrl)
      throw new Error('URL не указан')

    trackerState.isSyncing = true
    try {
      const res = await fetch(trackerState.syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId: trackerState.vaultId,
          identifier: trackerState.identifier,
          logs: trackerState.logs,
        }),
      })

      if (!res.ok)
        throw new Error(`Ошибка сервера: ${res.status}`)

      const remoteLogs: ReadLog[] = await res.json()
      const mergedMap = new Map<string, ReadLog>()

      trackerState.logs.forEach(l => mergedMap.set(l.path, { ...l, readDates: [...l.readDates], visits: [...l.visits] }))

      remoteLogs.forEach((rl) => {
        if (mergedMap.has(rl.path)) {
          const local = mergedMap.get(rl.path)!
          local.readDates = Array.from(new Set([...local.readDates, ...rl.readDates])).sort((a, b) => a - b)
          
          const visitMap = new Map<number, ReadLogVisit>()
          local.visits.forEach(v => visitMap.set(v.timestamp, v))
          ;(rl.visits || []).forEach(v => visitMap.set(v.timestamp, v))
          local.visits = Array.from(visitMap.values()).sort((a, b) => a.timestamp - b.timestamp)
          
          local.title = rl.title || local.title
        }
        else {
          mergedMap.set(rl.path, { ...rl, visits: rl.visits || rl.readDates.map((ts: number) => ({ timestamp: ts, duration: 60 })) })
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
