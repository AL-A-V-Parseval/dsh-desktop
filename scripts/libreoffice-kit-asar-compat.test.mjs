/** Exercise the installed Office adapter under real Electron ASAR filesystem semantics. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

const workspace = resolve(import.meta.dirname, '../dsh-desktop-next')
const require = createRequire(join(workspace, 'package.json'))
const installed = existsSync(join(workspace, 'node_modules/@deepseek-ai/libreoffice-kit/package.json'))

test('Office discovery treats a missing ASAR native package as absent, but rejects an installed broken package', {
  skip: process.platform !== 'linux' || !installed,
}, async () => {
  const { createPackage } = await import(require.resolve('@electron/asar'))
  const electron = require('electron')
  const kit = join(workspace, 'node_modules/@deepseek-ai/libreoffice-kit')
  const home = mkdtempSync(join(tmpdir(), 'dsh-office-asar-'))
  try {
    const fixture = join(home, 'fixture')
    const modules = join(fixture, 'node_modules')
    const entry = join(modules, '@deepseek-ai/libreoffice-kit')
    const officeKit = join(modules, '@deepseek-ai/dsh-office-kit')
    const wasm = join(modules, '@deepseek-ai/libreoffice-kit-wasm')
    mkdirSync(join(entry, 'lib'), { recursive: true })
    mkdirSync(wasm, { recursive: true })
    writeFileSync(join(entry, 'package.json'), readFileSync(join(kit, 'package.json')))
    writeFileSync(join(entry, 'lib/index.js'), readFileSync(join(kit, 'lib/index.js')))
    cpSync(join(workspace, 'node_modules/@deepseek-ai/dsh-office-kit'), officeKit, { recursive: true, dereference: true })
    writeFileSync(join(wasm, 'package.json'), JSON.stringify({ name: '@deepseek-ai/libreoffice-kit-wasm', version: '0.2.3' }))
    writeFileSync(join(wasm, 'prebuilds.json'), JSON.stringify({ schemaVersion: 1, version: '0.2.3',
      platform: 'wasm', status: 'built', engine: { kind: 'wasm', programDirectory: '/instdir/program',
        loader: 'loader.cjs', wasm: 'engine.wasm', data: 'engine.data', metadata: 'metadata.json' } }))
    // Discovery checks metadata and file presence only; no engine is executed in this fixture.
    for (const name of ['loader.cjs', 'engine.wasm', 'engine.data', 'metadata.json']) writeFileSync(join(wasm, name), '')
    symlinkSync(join(workspace, 'node_modules'), join(home, 'node_modules'), 'dir')
    const runner = join(home, 'check.mjs')
    writeFileSync(runner, `
      import assert from 'node:assert/strict';
      import {pathToFileURL} from 'node:url';
      const root = process.argv[2]+'/node_modules/@deepseek-ai/';
      const {discoverRuntime}=await import(pathToFileURL(root+'libreoffice-kit/lib/index.js'));
      const {OfficeKit}=await import(pathToFileURL(root+'dsh-office-kit/lib/index.js'));
      const {resolveEnginePackage}=await OfficeKit.prototype.importKit();
      for (const options of [undefined, {resolveEnginePackage}]) {
        if(process.argv[3]==='broken') await assert.rejects(discoverRuntime(options), /Installed LibreOfficeKit package is incomplete/);
        else assert.equal((await discoverRuntime(options)).backend,'wasm');
      }
    `)
    const archive = join(home, 'app.asar')
    await createPackage(fixture, archive)
    const run = mode => execFileSync(electron, [runner, archive, mode], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, encoding: 'utf8', timeout: 30_000,
    })
    run('absent')
    const broken = join(modules, '@deepseek-ai/libreoffice-kit-linux-x64-glibc')
    mkdirSync(broken)
    writeFileSync(join(broken, 'incomplete.txt'), 'Intentionally missing package.json')
    await createPackage(fixture, archive)
    run('broken')
  } finally {
    rmSync(home, { recursive: true, force: true })
  }
})
