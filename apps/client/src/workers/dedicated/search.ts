import Fuse from 'fuse.js'

const ctx = globalThis as unknown as DedicatedWorkerGlobalScope

let fuse: Fuse<any> | null = null

ctx.addEventListener('message', (event) => {
  const { type, payload } = event.data

  if (type === 'INIT') {
    fuse = new Fuse(payload.index, payload.options)
  }
  else if (type === 'SEARCH') {
    if (!fuse)
      return
    const results = fuse.search(payload.query)
    ctx.postMessage({ type: 'RESULT', payload: results })
  }
})
