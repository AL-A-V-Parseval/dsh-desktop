import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'
import { promisify, stripVTControlCharacters } from 'node:util'
import { runInNewContext } from 'node:vm'
import { AA_WORKSPACES } from './agents-anywhere-release-policy.mjs'

// Exercise the installed artifact: a patch file alone does not prove Yarn applied it.
function loadConnector(workspace, environment) {
  const source = readFileSync(new URL(`../${workspace}/node_modules/@agents-anywhere/dsh-bridge-next/lib/index.js`, import.meta.url), 'utf8')
  const start = source.indexOf('//#region src/host/connector/logs.ts')
  const end = source.indexOf('//#region src/host/desktop/detect.ts', start)
  assert.ok(start >= 0 && end > start)
  return runInNewContext(`${source.slice(start, end)}; SourceConnector`, {
    execFile, promisify, stripVTControlCharacters, join, setTimeout, clearTimeout,
    process: { platform: process.platform, env: environment },
    readJson$1: async () => [], writeJson: async () => {}, mkdir: async () => {},
    resolveUv: async () => 'uv',
    DEFAULT_CONNECTOR_SETTINGS: { syncIntervalSeconds: 30 },
  })
}

for (const workspace of AA_WORKSPACES) {
  test(`${workspace}: Python gets a compatible bypass list without changing the parent`, async () => {
    const env = {
      NO_PROXY: 'localhost,127.0.0.1,::1,[::1],.example.com',
      no_proxy: 'internal.test, [::1] ',
      HTTPS_PROXY: 'http://127.0.0.1:7890',
    }
    const original = { ...env }
    const Connector = loadConnector(workspace, env)
    const child = new EventEmitter()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.stdin = new EventEmitter()
    child.exitCode = null
    child.signalCode = null
    child.stdin.write = line => {
      const request = JSON.parse(line)
      queueMicrotask(() => child.stdout.write(JSON.stringify({
        jsonrpc: '2.0', id: request.id,
        result: { running: request.method === 'connector.start', authFailed: false },
      }) + '\n'))
    }
    let launched
    const connector = new Connector({ stateRoot: '/state', connectorSourceDir: '/source', uvPath: 'uv' },
      (_command, _args, options) => { launched = options; return child })
    await connector.start({ connectorId: 'device', connectorToken: 'private-test-token' }, 'https://example.com', new AbortController().signal)
    assert.equal(connector.running, true)
    assert.equal(launched.env.NO_PROXY, 'localhost,127.0.0.1,::1,::1,.example.com')
    assert.equal(launched.env.no_proxy, 'internal.test,::1')
    assert.equal(launched.env.HTTPS_PROXY, env.HTTPS_PROXY)
    assert.deepEqual(env, original)
    await connector.logs.flush()
  })

  test(`${workspace}: RPC errors reach logs and credentials stay redacted`, async () => {
    const Connector = loadConnector(workspace, {})
    const connector = new Connector({ stateRoot: '/state' }, () => {})
    await connector.logs.startSession(['private-test-token'])
    const frame = JSON.stringify({ jsonrpc: '2.0', method: 'connector/log', params: {
      level: 'ERROR', message: "Invalid port: ':1]' private-test-token",
      exception: 'InvalidURL private-test-token',
    } }) + '\n'
    connector.receive(frame.slice(0, 31))
    connector.receive(frame.slice(31))
    await connector.logs.flush()
    const lines = Array.from(connector.logs.entries, entry => entry.text)
    assert.deepEqual(lines, ["[connector] ERROR: Invalid port: ':1]' [REDACTED]", 'InvalidURL [REDACTED]'])
  })
}
