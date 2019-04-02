const fs = require('fs')
const path = require('path')
const Metro = require('metro')
const express = require('express')
const app = express()
const MemoryFileSystem = require('memory-fs')
const { parse } = require('node-html-parser')
const server = require('http').Server(app)

const htmlDoc = parse(fs.readFileSync('./public/index.html', 'utf8'))
const memfs = new MemoryFileSystem()
const publicDir = './public'
fs.readdirSync(publicDir).forEach(fileName => {
  const filePath = path.join(publicDir, fileName)
  const stat = fs.statSync(filePath)
  if (stat.isFile()) {
    if (fileName === 'index.html') {
      memfs.writeFileSync(
        '/index.html',
        '<!DOCTYPE html>\n' + htmlDoc.toString(),
      )
    } else {
      memfs.writeFileSync('/' + fileName, fs.readFileSync(filePath, 'utf8'))
    }
  }
})

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(memfs.readFileSync('/index.html'))
})

app.get('*', (req, res, next) => {
  if (!req.path.includes('index.delta')) {
    res.send(memfs.readFileSync(req.path))
  } else {
    next()
  }
})

Metro.loadConfig().then(async config => {
  const connectMiddleware = await Metro.createConnectMiddleware(config)
  const {
    server: { port },
  } = config
  app.use(connectMiddleware.middleware)
  server.listen(port)
  console.log(`Your 🚆  is holding on http://localhost:${port}`)
  connectMiddleware.attachHmrServer(server)
})
