const port = 3000
const host = 'localhost'
const entry = 'index.js'

;(async function(global) {
  let cachedBundleUrls = new Map()
  ;('use strict')

  function getBlobBundle(bundle) {
    let cachedBundle = cachedBundleUrls.get(bundle.revisionId)
    if (
      hotClient.getLastNumModifiedFiles() === 0 &&
      cachedBundle != null &&
      cachedBundle !== ''
    ) {
      return cachedBundle
    }

    if (cachedBundle != null && cachedBundle !== '') {
      URL.revokeObjectURL(cachedBundle)
    }

    const blobContent = hotClient.getAllModules().map(module => module + '\n')

    blobContent[blobContent.length - 1] = blobContent[
      blobContent.length - 1
    ].replace(
      'sourceMappingURL=//localhost:3000/',
      'sourceMappingURL=http://localhost:3000/',
    )
    const blob = new Blob(blobContent, {
      type: 'application/javascript',
    })
    const bundleContents = URL.createObjectURL(blob)
    cachedBundleUrls.set(bundle.revisionId, bundleContents)
    return bundleContents
  }

  function addBundleToBody(src) {
    let metroBundle = document.getElementById('metro-bundle')
    if (!metroBundle) {
      metroBundle = document.createElement('script')
      document.body.appendChild(metroBundle)
    }
    metroBundle.setAttribute('src', src)
  }

  class MetroHotClient {
    constructor() {
      this._lastBundle = {
        revisionId: undefined,
        pre: '',
        post: '',
        modules: new Map(),
      }
      this._initialized = false
      this._lastNumModifiedFiles = 0
      this._lastModifiedDate = new Date()
      this._instance = undefined
    }

    static getInstance() {
      if (!this._instance) {
        this._instance = new MetroHotClient()
      }
      return this._instance
    }

    init() {
      return new Promise(resolve => {
        const interval = setInterval(async () => {
          try {
            const bundleDeltaRes = await fetch(
              `http://${host}:${port}/bundle.delta.json`,
            )
            const baseBundle = await bundleDeltaRes.json()
            clearInterval(interval)
            this.applyDelta(baseBundle)
            resolve()
          } catch (error) {}
        }, 1000)
      })
    }

    applyDelta(bundle) {
      if (!this._initialized && !bundle.base) {
        throw new Error('MetroHotClient should be initialized first!')
      }
      this._initialized = true

      if (bundle.base) {
        this._lastNumModifiedFiles = bundle.modules.length

        this._lastBundle = {
          revisionId: bundle.revisionId,
          pre: bundle.pre,
          post: bundle.post,
          modules: new Map(bundle.modules),
        }
      } else {
        const modules = bundle.modules
          ? bundle.modules
          : bundle.added.concat(bundle.modified)

        this._lastNumModifiedFiles = modules.length + bundle.deleted.length

        this._lastBundle.revisionId = bundle.revisionId

        for (const [key, value] of modules) {
          this._lastBundle.modules.set(key, value)
        }

        for (const id of bundle.deleted) {
          this._lastBundle.modules.delete(id)
        }
      }

      if (this._lastNumModifiedFiles > 0) {
        this._lastModifiedDate = new Date()
      }

      return this
    }
    getLastRevisionId() {
      return this._lastBundle.revisionId
    }

    getLastNumModifiedFiles() {
      return this._lastNumModifiedFiles
    }

    getLastModifiedDate() {
      return this._lastModifiedDate
    }

    getAllModules() {
      return [].concat(
        [this._lastBundle.pre],
        Array.from(this._lastBundle.modules.entries())
          .sort(([id1], [id2]) => id1 - id2)
          .map(([id, contents]) => contents),
        [this._lastBundle.post],
      )
    }
  }

  const hotClient = MetroHotClient.getInstance()
  await hotClient.init()

  const ws = new WebSocket(
    `ws://${host}:${port}/hot?bundleEntry=${entry}&platform=web`,
  )

  ws.onmessage = async function(message) {
    if (!message.data) {
      return
    }
    const object = JSON.parse(message.data)

    switch (object.type) {
      case 'error':
        console.error(object.body.message)
        break
      case 'update':
        const { revisionId, modified, deleted, added } = object.body
        if (hotClient.getLastRevisionId !== revisionId) {
          const delta = {
            revisionId,
            added,
            modified,
            deleted,
          }
          hotClient.applyDelta(delta)
          const changed = hotClient.getLastNumModifiedFiles()
          if (changed > 0) {
            console.log('Starting HMR update')
            addBundleToBody(getBlobBundle(delta))
            console.log(`${changed} files changed!`)
            console.log('HMR update done!')
          }
        }
        break
    }
  }

  global.MetroHotClient = hotClient
})(window)
