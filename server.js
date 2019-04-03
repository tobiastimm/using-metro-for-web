const fs = require('fs')
const path = require('path')
const Metro = require('metro')
const express = require('express')
const fetch = require('node-fetch')
const MemoryFileSystem = require('memory-fs')
const { parse } = require('node-html-parser')

const app = express()
const server = require('http').Server(app)

const memfs = new MemoryFileSystem()

const publicDir = './public'
fs.readdirSync(publicDir).forEach(fileName => {
  const filePath = path.join(publicDir, fileName)
  const stat = fs.statSync(filePath)
  if (stat.isFile()) {
    if (fileName !== 'index.html') {
      memfs.writeFileSync('/' + fileName, fs.readFileSync(filePath, 'utf8'))
    }
  }
})

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(memfs.readFileSync('/index.html'))
})

const whiteList = ['index.bundle', 'index.delta', 'index.map']

app.get('*', (req, res, next) => {
  if (whiteList.every(entry => !req.path.includes(entry))) {
    res.send(memfs.readFileSync(req.path))
  } else {
    next()
  }
})

function createIndex(memfs) {
  const htmlDoc = parse(fs.readFileSync('./public/index.html', 'utf8'))
  memfs.writeFileSync('/index.html', '<!DOCTYPE html>\n' + htmlDoc.toString())
}

async function prepareDelta(memfs) {
  const res = await fetch(
    'http://localhost:3000/index.delta?platform=web&dev=true&minify=false',
  )
  const delta = await res.json()
  const getAllModules = bundle => {
    return [].concat(
      [bundle.pre],
      Array.from(bundle.modules)
        .sort(([id1], [id2]) => id1 - id2)
        .map(([id, contents]) => contents),
      [bundle.post],
    )
  }
  memfs.writeFileSync('/bundle.delta.json', delta)
  memfs.writeFileSync('/bundle.js', getAllModules(delta).join('\n'))
}

Metro.loadConfig().then(async config => {
  createIndex(memfs)
  const connectMiddleware = await Metro.createConnectMiddleware(config)
  const {
    server: { port },
  } = config
  app.use(connectMiddleware.middleware)
  server.listen(port)
  connectMiddleware.attachHmrServer(server)
  await prepareDelta(memfs)
  console.log(`Your 🚇  is holding on http://localhost:${port}`)
})
