const port = 3000
const host = 'localhost'
const entry = 'index.js'
const url = 'index.bundle?platform=web&dev=true&minify=false'

async function getBlobUrl(url) {
  return await window.deltaUrlToBlobUrl(url.replace('.bundle', '.delta'))
}

function addScriptToBody(src, type = 'text/javascript') {
  const s = document.createElement('script')
  s.setAttribute('src', src)
  s.setAttribute('type', type)
  document.body.appendChild(s)
}

async function init() {
  // const lastRevisionId = window.DeltaPatcher._deltaPatchers
  //   .get(deltaUrl)
  //   .getLastRevisionId()
  const bundle = await getBlobUrl(url)
  addScriptToBody(bundle)
  // addScriptToBody(
  //   url.replace('.bundle', '.map') + '&revisionId=' + lastRevisionId,
  //   'application/json',
  // )

  let worker
  // let queuedMessages = []
  // let appExecuted = false
  // worker = new Worker('debuggerWorker.js')
  // worker.onmessage = function(message) {
  //   ws.send(JSON.stringify(message.data))
  // }

  // worker.postMessage({
  //   method: 'executeApplicationScript',
  //   url: await getBlobUrl(url),
  // })

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
        return
      case 'update-start':
        console.log('Starting HMR update')
        break
      case 'update-done':
        console.log('HMR update done!')
        break
      case 'update':
        const bundle = await getBlobUrl(url)
        break
    }
  }
}

init()
