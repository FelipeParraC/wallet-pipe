const Module = require('node:module')
const path = require('node:path')

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
})

const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const mappedRequest = path.join(__dirname, '..', 'src', request.slice(2))
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

require('../node_modules/ts-node/register/transpile-only')
require('../src/tests/domain.test.ts')
require('../src/tests/server-actions.integration.test.ts')
