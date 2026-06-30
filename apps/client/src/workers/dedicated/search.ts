import Fuse from 'fuse.js'

const ctx = globalThis as unknown as DedicatedWorkerGlobalScope

let fuseAll: Fuse<any> | null = null
let fuseFiles: Fuse<any> | null = null

ctx.addEventListener('message', (event) => {
  const { type, payload } = event.data

  if (type === 'INIT') {
    fuseAll = new Fuse(payload.index, payload.optionsAll)
    fuseFiles = new Fuse(payload.index, payload.optionsFiles)
  }
  else if (type === 'SEARCH') {
    const { query, mode } = payload
    const fuse = mode === 'files' ? fuseFiles : fuseAll
    if (!fuse)
      return
    const results = fuse.search(query)
    ctx.postMessage({ type: 'RESULT', payload: results })
  }
})
