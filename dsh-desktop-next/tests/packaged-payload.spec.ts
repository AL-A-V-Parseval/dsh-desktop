import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { formatPrunedPayload, nextPackagingTarget, nextPayloadRelease, pruneNextPayload, sealNextPayload } from '../scripts/packaged-payload.ts'
import { DESKTOP_RUNTIME_FILE, readDesktopRuntime, verifyDesktopRuntime } from '../src/runtime-tree.ts'
import { FIXTURE_RELEASE, FIXTURE_SHARED, writePackage } from './runtime-fixture.ts'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function copiedPayload(): string {
  const root = mkdtempSync(join(tmpdir(), 'desktop-payload-'))
  roots.push(root)
  const app = join(root, 'app')
  const modules = join(app, 'node_modules')
  for (const name of FIXTURE_SHARED) {
    writePackage(modules, name, { version: name === '@deepseek-ai/dsh' ? FIXTURE_RELEASE.dshVersion : name === 'pnpm' ? FIXTURE_RELEASE.pnpmVersion : '1.0.0' })
  }
  mkdirSync(join(app, 'lib'), { recursive: true })
  writeFileSync(join(app, 'lib', 'main.js'), 'export {}\n')
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'dsh-desktop-next', version: FIXTURE_RELEASE.version, type: 'module',
    dependencies: Object.fromEntries(FIXTURE_SHARED.map(name => [name, '*'])) }) + '\n')
  return app
}

it('describes the architectures each release target carries', () => {
  expect(nextPackagingTarget('darwin')).toEqual({ platform: 'darwin', archs: ['arm64', 'x64'] })
  expect(nextPackagingTarget('win32')).toEqual({ platform: 'win32', archs: ['x64'] })
  expect(nextPackagingTarget('linux', 'arm64')).toEqual({ platform: 'linux', archs: ['arm64'] })
})

it('prunes policy omissions from the copied tree, drops emptied directories, and reports by reason', () => {
  const app = copiedPayload()
  const modules = join(app, 'node_modules')
  for (const path of ['@deepseek-ai/dsh/lib/index.js.map', '@deepseek-ai/dsh/lib/index.d.ts', '@deepseek-ai/dsh/tsconfig.tsbuildinfo',
    'node-pty/prebuilds/darwin-arm64/pty.node', 'node-pty/prebuilds/win32-x64/conpty.node', 'node-pty/prebuilds/linux-x64/pty.node',
    '.bin/dsh', 'kept/lib/index.js', 'kept/README.md']) {
    mkdirSync(join(modules, path, '..'), { recursive: true })
    writeFileSync(join(modules, path), `payload:${path}`)
  }
  const summary = pruneNextPayload(app, { platform: 'darwin', archs: ['arm64', 'x64'] })
  expect(summary.removed).toBe(6)
  expect(summary.reasons).toEqual({ 'source map': 1, 'TypeScript declaration': 1, 'TypeScript build cache': 1, 'node-pty other platform': 2, 'package-manager metadata': 1 })
  expect(summary.bytes).toBeGreaterThan(0)
  expect(formatPrunedPayload(summary)).toMatch(/^6 files, 0\.0 MiB \(TypeScript build cache=1, TypeScript declaration=1, node-pty other platform=2, package-manager metadata=1, source map=1\)$/u)
  expect(existsSync(join(modules, '.bin'))).toBe(false)
  expect(existsSync(join(modules, 'node-pty', 'prebuilds', 'linux-x64'))).toBe(false)
  expect(existsSync(join(modules, 'node-pty', 'prebuilds', 'win32-x64'))).toBe(false)
  expect(existsSync(join(modules, 'node-pty', 'prebuilds', 'darwin-arm64', 'pty.node'))).toBe(true)
  expect(existsSync(join(modules, '@deepseek-ai', 'dsh', 'index.js'))).toBe(true)
  expect(existsSync(join(modules, '@deepseek-ai', 'dsh', 'lib'))).toBe(false)
  expect(existsSync(join(modules, 'kept', 'README.md'))).toBe(true)
  expect(pruneNextPayload(app, { platform: 'darwin', archs: ['arm64', 'x64'] })).toEqual({ removed: 0, bytes: 0, reasons: {} })
})

it('reads release facts from the copied payload and seals a descriptor that verifies', async () => {
  const app = copiedPayload()
  const release = nextPayloadRelease(app, '44.0.0')
  expect(release).toEqual(FIXTURE_RELEASE)
  const target = nextPackagingTarget(process.platform, process.arch)
  const sealed = await sealNextPayload(app, release, target)
  expect(sealed.sharedPackages.map(entry => entry.name)).toEqual([...FIXTURE_SHARED].sort())
  expect(sealed.files.map(file => file.path)).toContain('package.json')
  expect(sealed.files.some(file => file.path === DESKTOP_RUNTIME_FILE)).toBe(false)
  expect(readDesktopRuntime(app)).toEqual(sealed)
  expect(await verifyDesktopRuntime(app, release.version, target)).toEqual(sealed)
  writeFileSync(join(app, 'lib', 'main.js'), 'tampered')
  await expect(verifyDesktopRuntime(app, release.version, target)).rejects.toThrow(/integrity/u)
  expect(JSON.parse(readFileSync(join(app, DESKTOP_RUNTIME_FILE), 'utf8'))).toEqual(sealed)
})

it('refuses to seal a payload whose manifest or pnpm has no version', () => {
  const app = copiedPayload()
  writeFileSync(join(app, 'node_modules', 'pnpm', 'package.json'), '{"name":"pnpm"}')
  expect(() => nextPayloadRelease(app, '44.0.0')).toThrow(/pnpm has no version/u)
})
