import type { DbWorkerFunctions, MainThreadFunctions } from '~/shared/types/rpc'
import { createBirpc } from 'birpc'
import SqliteWorker from '~/workers/dedicated/sqlite.worker?worker'

const worker = new SqliteWorker()

// Хендлер прогресса регистрируется из vault.store (избегаем циклического импорта)
let progressHandler: MainThreadFunctions['onSyncProgress'] = () => { }

export function setSyncProgressHandler(handler: MainThreadFunctions['onSyncProgress']) {
  progressHandler = handler
}

const mainFunctions: MainThreadFunctions = {
  onSyncProgress: (vaultId, progress) => progressHandler(vaultId, progress),
}

export const dbRpc = createBirpc<DbWorkerFunctions, MainThreadFunctions>(
  mainFunctions,
  {
    post: data => worker.postMessage(data),
    on: fn => worker.addEventListener('message', event => fn(event.data)),
  },
)
