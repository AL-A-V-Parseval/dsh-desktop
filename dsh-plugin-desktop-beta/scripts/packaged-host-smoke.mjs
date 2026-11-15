/** Boot the real Host from one packaged Next archive and stop it; no window, no user data. */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const BADGE_BUNDLE = '@deepseek-ai/dsh-experimental-badge-skill-bundle'
const root = process.argv[2]
if (!root) throw new Error('packaged-host-smoke: expected the packaged application root')
const { NextDesktopRuntime } = await import(pathToFileURL(join(root, 'lib', 'desktop-runtime.js')).href)
const home = mkdtempSync(join(tmpdir(), 'dsh-next-packaged-smoke-'))
// Exercise each override in a fresh process, never the real user environment.
process.env.HOME = home
process.env.XDG_CONFIG_HOME = join(home, 'config')
process.env.XDG_CACHE_HOME = join(home, 'cache')
process.env.XDG_STATE_HOME = join(home, 'state')
delete process.env.DSH_BUNDLED_PRIMARY_RUNTIME
const primaryRuntime = join(dirname(root), 'runtime', process.arch, 'primary-runtime')
const officeMode = process.argv[3] ?? 'default'
if (!['default', 'override', 'disabled'].includes(officeMode)) throw new Error('Invalid Office smoke mode')
if (officeMode === 'default') delete process.env.DSH_PRIMARY_RUNTIME
else process.env.DSH_PRIMARY_RUNTIME = officeMode === 'disabled' ? '' : primaryRuntime
let failures = 0
// The payload of this CPU sits beside the archive, where the packaged shell selects it.
const runtime = new NextDesktopRuntime({ root, home, primaryRuntime, executable: process.execPath, addresses: () => [],
  certificate: async () => { throw new Error('The packaged smoke must not request system key storage or expose a LAN listener') },
  onFailure: () => { failures += 1 }, onChange() {}, onRestart() {}, onTerminal() {}, onNotification() {},
})
try {
  runtime.initialize()
  runtime.profiles.ensure('desktop')
  // The Community Market bundle loads from the archive; remote control stays off because the
  // bridge shares its state directory with the user's other editions; the native computer-use
  // provider loads its library from the unpacked platform package when the Host activates it.
  runtime.profiles.finishOnboarding('desktop', { features: { market: true, remoteControl: false }, computerUse: true })
  if (!runtime.profiles.computerUseEnabled('desktop')) throw new Error('The smoke profile did not enable the native computer-use provider')
  // The badge skill bundle is off by default; enabled, the Host loads its provider from the unpacked copy through the resolver.
  // Official packages the installation offers among its optional bundles (Beta's OAR subagents) load from the archive.
  const installation = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const officialOptional = installation.dsh.optionalBundles.filter(name => name.startsWith('@deepseek-ai/'))
  const manifestPath = join(runtime.profiles.directory('desktop'), 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  for (const name of [BADGE_BUNDLE, ...officialOptional]) if (!manifest.dsh.profile.bundles.includes(name)) manifest.dsh.profile.bundles.push(name)
  writeFileSync(manifestPath, `${JSON.stringify(manifest, undefined, 2)}\n`)
  await runtime.start()
  const state = runtime.state()
  if (state.phase !== 'ready' || failures !== 0) throw new Error(`Packaged Host did not reach ready: phase=${state.phase} failure=${state.failure}`)
  const auth = runtime.auth
  if (!auth) throw new Error('Packaged Host reported ready without native credentials')
  // rc.3 owns Office in the Web profile, so a Desktop-only mount log no longer proves activation.
  const rpcId = crypto.randomUUID()
  const pluginsResponse = await fetch(new URL('/api/pluginManager/listPlugins', auth.url), {
    method: 'POST', headers: { cookie: auth.cookie, 'x-dsh-desktop-renderer': auth.token,
      origin: new URL(auth.url).origin, 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId, method: 'pluginManager/listPlugins', payload: { args: {} } }),
  })
  const pluginsReply = await pluginsResponse.json()
  if (!pluginsReply.result.ok) throw new Error(`Cannot inspect packaged Office: ${JSON.stringify(pluginsReply.result.error)}`)
  for (const moduleName of ['@deepseek-ai/dsh-skill-office', '@deepseek-ai/dsh-tool-workspace-dependencies']) {
    const rows = pluginsReply.result.value.filter(row => row.moduleName === moduleName)
    if (rows.length !== 1) throw new Error(`Office mode ${officeMode}: expected one ${moduleName}, got ${rows.length}`)
    const active = rows[0].enabled && rows[0].fiberPhase === 'active'
    if (active !== (officeMode !== 'disabled')) throw new Error(`Office mode ${officeMode}: ${moduleName} activation ${String(active)}`)
  }
  // Only the native capability passes the request gate; a bare loopback browser request is refused.
  const response = await fetch(new URL(auth.url).origin)
  if (response.status !== 403) throw new Error(`Packaged Host exposed the application to ordinary browsers: HTTP ${String(response.status)}`)
  await response.body?.cancel()
  // Diagnostics export runs a worker thread from the archive.
  const report = join(home, 'diagnostics.json')
  await runtime.diagnostics.exportTo(report, { ...state, platform: process.platform, version: 'smoke', updates: null, trayAvailable: false, notificationsAvailable: false, onboarding: false })
  if (!existsSync(report)) throw new Error('Packaged diagnostics export produced no file')
  // The loader reports optional plugins it could not activate on stderr, which the shell records.
  const inactive = runtime.diagnostics.snapshot().split('\n').filter(line => line.includes('did not activate'))
  if (inactive.length > 0) throw new Error(`Packaged Host left plugins inactive:\n${inactive.join('\n')}`)
  console.log(`Packaged Next Host booted from ${root}: Office ${officeMode}, profile ${state.selected}, loopback ${new URL(auth.url).origin}, diagnostics export ok`)
} finally {
  await runtime.close()
  rmSync(home, { recursive: true, force: true })
}
