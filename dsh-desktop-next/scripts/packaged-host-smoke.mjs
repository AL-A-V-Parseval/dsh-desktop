/** Boot the real Host from one packaged Next payload and stop it; no window, no user data. */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
if (!root) throw new Error('packaged-host-smoke: expected the packaged application root')
const { NextDesktopRuntime } = await import(pathToFileURL(join(root, 'lib', 'desktop-runtime.js')).href)
const home = mkdtempSync(join(tmpdir(), 'dsh-next-packaged-smoke-'))
let failures = 0
const runtime = new NextDesktopRuntime({ root, home, executable: process.execPath, addresses: () => [],
  certificate: async () => { throw new Error('The packaged smoke must not request system key storage or expose a LAN listener') },
  onFailure: () => { failures += 1 }, onChange() {}, onRestart() {}, onTerminal() {}, onNotification() {},
})
try {
  runtime.initialize()
  runtime.profiles.ensure('desktop')
  runtime.profiles.setFeatures('desktop', { market: false, remoteControl: false })
  await runtime.start()
  const state = runtime.state()
  if (state.phase !== 'ready' || failures !== 0) throw new Error(`Packaged Host did not reach ready: phase=${state.phase} failure=${state.failure}`)
  const auth = runtime.auth
  if (!auth) throw new Error('Packaged Host reported ready without native credentials')
  // Only the native capability passes the request gate; a bare loopback browser request is refused.
  const response = await fetch(new URL(auth.url).origin)
  if (response.status !== 403) throw new Error(`Packaged Host exposed the application to ordinary browsers: HTTP ${String(response.status)}`)
  await response.body?.cancel()
  console.log(`Packaged Next Host booted from ${root}: profile ${state.selected}, loopback ${new URL(auth.url).origin}`)
} finally {
  await runtime.close()
  rmSync(home, { recursive: true, force: true })
}
