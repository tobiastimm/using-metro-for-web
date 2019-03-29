module.exports = {
  server: {
    port: 3000,
  },
  resolver: {
    resolverMainFields: ['browser', 'main'],
  },
  transformer: {
    minifierPath: 'metro-minify-terser',
  },
}
