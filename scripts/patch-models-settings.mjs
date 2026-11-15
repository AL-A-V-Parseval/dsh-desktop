/** Reproduce the fork's Models-page patch against the untouched vendored runtime. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const require = createRequire(join(root, 'dsh-desktop-next/package.json'))
const MagicString = require('magic-string')
const remapping = require('@jridgewell/remapping')
const version = JSON.parse(readFileSync(join(root, 'upstream.json'), 'utf8')).channels.next.runtimePackageVersion
const name = 'dsh-client-ui-settings-models'
const temp = mkdtempSync(join(tmpdir(), 'dsh-models-patch-'))

/** Keep the built-in API addable after removing its user settings and local key. */
function deepSeekApiRow(row, namespace, rows) {
  if (row.entry.provider !== 'deepseek-official' || row.entry.settingsPath.length !== 0 || namespace === void 0 || row.credential === void 0) return row
  const hasUserSettings = namespace.user !== void 0 && namespace.user !== null && Object.keys(namespace.user).length > 0
  const sharedCredential = rows.some(other => other.entry.provider !== row.entry.provider && other.apiKeyEnv === row.apiKeyEnv)
  const configured = hasUserSettings || row.credential.configured
  return { ...row, configured,
    removable: configured && !sharedCredential && row.credential.writable && (!row.credential.configured || row.credential.source === 'file') }
}

try {
  execFileSync('tar', ['-xzf', join(root, `vendor/dsh-runtime/${version}/deepseek-ai-${name}-${version}.tgz`), '-C', temp])
  const cwd = join(temp, 'package')
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  git('init', '-q'); git('add', '.')
  const file = 'lib/client.js'
  const source = readFileSync(join(cwd, file), 'utf8')
  const code = new MagicString(source)
  const once = (before, after) => {
    const at = source.indexOf(before)
    assert.ok(at >= 0 && source.indexOf(before, at + before.length) === -1, `Expected unique Models seam: ${before}`)
    code.overwrite(at, at + before.length, after)
  }
  once('props.credentialOnly===true?null:', `[
    'anthropic','openai-codex','github-copilot','xai','kimi-coding','meta','openrouter','radius'
  ].includes(props.provider) ? react_jsx_runtime.jsx('div', {
    "data-dsh-codex-signin": "mount", "data-provider": props.provider
  }) : null,props.credentialOnly===true?null:`)
  once('const managedRef=deriveKeyRef(row.entry.provider);',
    "const managedRef=row.entry.provider==='deepseek-official'&&row.entry.settingsPath.length===0&&row.removable?row.apiKeyEnv:deriveKeyRef(row.entry.provider);")
  once('function providerCopy(', `${deepSeekApiRow.toString()}\nfunction providerCopy(`)
  once('displayName:t(`deepSeekAccount`)}}:row)',
    'displayName:t(`deepSeekAccount`)}}:deepSeekApiRow(row,snapshot.namespaces.get(row.entry.settingsNs),snapshot.rows))')
  const map = remapping([JSON.parse(code.generateMap({ file, source: file, hires: true }).toString()),
    JSON.parse(readFileSync(join(cwd, `${file}.map`), 'utf8'))], () => null)
  writeFileSync(join(cwd, `${file}.map`), JSON.stringify(map))
  writeFileSync(join(cwd, file), code.toString())
  const diff = git('diff', '--no-ext-diff', '--binary')
  assert.ok(diff.length > 0)
  writeFileSync(join(root, `patches/${name}@${version}.patch`), diff)
  console.log(`${name}@${version}: OAuth mount and local API removal patch generated with composed source map`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
