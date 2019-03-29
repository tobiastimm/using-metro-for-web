const Metro = require('metro')
const express = require('express')
const app = express()
const server = require('http').Server(app)

Metro.loadConfig().then(async config => {
  const connectMiddleware = await Metro.createConnectMiddleware(config)
  const {
    server: { port },
  } = config
  app.use('/', express.static('public'))
  app.use(connectMiddleware.middleware)
  server.listen(port)
  console.log(`Your 🚆  is holding on http://localhost:${port}`)
  connectMiddleware.attachHmrServer(server)
})
