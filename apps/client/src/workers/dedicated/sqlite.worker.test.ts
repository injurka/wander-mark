import type { DbWorkerFunctions } from '~/shared/types/rpc'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  functions: null as DbWorkerFunctions | null,
}))
vi.mock('@sqlite.org/sqlite-wasm', () => ({ default: mocks.init }))
vi.mock('birpc', () => ({
  createBirpc: (functions: DbWorkerFunctions) => {
    mocks.functions = functions
    return { onSyncProgress: vi.fn() }
  },
}))

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubGlobal('self', { postMessage: vi.fn(), addEventListener: vi.fn() })
  await import('./sqlite.worker')
})
afterEach(() => vi.unstubAllGlobals())

function database() {
  return { exec: vi.fn().mockReturnValue([]), close: vi.fn() }
}

describe('sqlite worker initialization', () => {
  it('uses persistent SAH pool storage when the default OPFS VFS is unavailable', async () => {
    const db = database()
    const open = vi.fn(class {
      constructor() {
        return db
      }
    })
    const install = vi.fn().mockResolvedValue({ OpfsSAHPoolDb: open })
    mocks.init.mockResolvedValue({ oo1: {}, installOpfsSAHPoolVfs: install })

    expect(await mocks.functions!.getFile('vault', 'note.md')).toBeNull()
    expect(install).toHaveBeenCalledWith({})
    expect(open).toHaveBeenCalledWith('/wander-mark.db')
    expect(db.exec).toHaveBeenCalledTimes(2)
  })

  it('preserves the existing OPFS backend and shares concurrent initialization', async () => {
    const db = database()
    const open = vi.fn(class {
      constructor() {
        return db
      }
    })
    mocks.init.mockResolvedValue({ oo1: { OpfsDb: open } })

    await Promise.all([mocks.functions!.initDb(), mocks.functions!.getFile('vault', 'note.md')])
    expect(mocks.init).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith('/wander-mark.db', 'c')
  })

  it('propagates the initialization error and allows a later retry', async () => {
    mocks.init.mockRejectedValueOnce(new Error('Storage unavailable'))
    await expect(mocks.functions!.getFile('vault', 'note.md')).rejects.toThrow('Storage unavailable')
    const db = database()
    mocks.init.mockResolvedValue({ oo1: { OpfsDb: vi.fn(class {
      constructor() {
        return db
      }
    }) } })
    await expect(mocks.functions!.getFile('vault', 'note.md')).resolves.toBeNull()
  })

  it('closes a database with a failed schema before retrying', async () => {
    const broken = database()
    broken.exec.mockImplementation(() => {
      throw new Error('Schema failed')
    })
    const healthy = database()
    let attempts = 0
    const open = vi.fn(class {
      constructor() {
        return attempts++ === 0 ? broken : healthy
      }
    })
    mocks.init.mockResolvedValue({ oo1: { OpfsDb: open } })

    await expect(mocks.functions!.initDb()).rejects.toThrow('Schema failed')
    expect(broken.close).toHaveBeenCalledOnce()
    await expect(mocks.functions!.initDb()).resolves.toBeUndefined()
    expect(healthy.exec).toHaveBeenCalledOnce()
  })
})
