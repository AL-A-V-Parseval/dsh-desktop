import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { fileURLToPath } from 'node:url'
import { expect, it, vi } from 'vitest'

interface Row {
  entry: { provider: string; displayName: string; settingsNs: string; settingsPath: string[] }
  configured: boolean
  removable: boolean
  apiKeyEnv: string
  credential?: { configured: boolean; writable: boolean; source?: string }
}

interface Target {
  provider: string
  settingsNs: string
  settingsPath: string[]
  credentialRef?: string
}

interface ModelActions {
  deepSeekApiRow(row: Row, namespace: { user?: object } | undefined, rows: Row[]): Row
  targetOf(row: Row): Target
  removeProviderProfile(operations: object, controller: object, target: Target): Promise<string | undefined>
}

// Evaluate the installed browser package, exposing internals only in this test copy.
// Production exports and the upstream checkout remain unchanged.
const root = dirname(fileURLToPath(import.meta.resolve('@deepseek-ai/dsh-client-ui-settings-models')))
const source = readFileSync(join(root, 'client.js'), 'utf8')
let actions: ModelActions
runInNewContext(source.replace('exports.apply = apply;',
  'Object.assign(exports, { deepSeekApiRow, targetOf, removeProviderProfile }); exports.apply = apply;'), {
  window: { __ModuleLoader__: { load: (definition: { factory(require: (name: string) => object): ModelActions }) => {
    const dependencies: Record<string, object> = {
      react: {}, 'react/jsx-runtime': {},
      '@deepseek-ai/dsh-client-ui-primitives': {}, '@deepseek-ai/dsh-client-store': {},
    }
    actions = definition.factory(name => {
      if (!(name in dependencies)) throw new Error(`Unexpected browser dependency: ${name}`)
      return dependencies[name]!
    })
  } } },
})

function api(credential: Row['credential'] = { configured: true, writable: true, source: 'file' }): Row {
  return { entry: { provider: 'deepseek-official', displayName: 'DeepSeek', settingsNs: 'llm-deepseek', settingsPath: [] },
    configured: true, removable: false, apiKeyEnv: 'DEEPSEEK_API_KEY', credential }
}

it('offers removal of the local DeepSeek API configuration using its actual credential reference', () => {
  const row = api()
  const projected = actions.deepSeekApiRow(row, { user: { apiKeyEnv: row.apiKeyEnv } }, [row])
  expect(projected.removable).toBe(true)
  expect(actions.targetOf(projected)).toMatchObject({ settingsNs: 'llm-deepseek', settingsPath: [], credentialRef: 'DEEPSEEK_API_KEY' })
})

it('makes an unconfigured API available to add again and restores its row once a new key is saved', () => {
  const empty = api({ configured: false, writable: true })
  expect(actions.deepSeekApiRow(empty, { user: {} }, [empty])).toMatchObject({ configured: false, removable: false })
  const restored = api()
  expect(actions.deepSeekApiRow(restored, { user: {} }, [restored])).toMatchObject({ configured: true, removable: true })
})

it('can remove user-only API settings without deleting an absent credential', () => {
  const row = api({ configured: false, writable: true })
  const projected = actions.deepSeekApiRow(row, { user: { baseURL: 'https://api.example.test' } }, [row])
  expect(projected.removable).toBe(true)
  expect(actions.targetOf(projected).credentialRef).toBeUndefined()
})

it.each([
  { configured: true, writable: true, source: 'env' },
  { configured: true, writable: false, source: 'file' },
])('does not offer deletion of external or read-only credentials: %j', credential => {
  const row = api(credential)
  expect(actions.deepSeekApiRow(row, { user: {} }, [row])).toMatchObject({ configured: true, removable: false })
})

it('preserves a credential shared with another provider', () => {
  const row = api()
  const other = { ...api(), entry: { ...row.entry, provider: 'custom' } }
  expect(actions.deepSeekApiRow(row, { user: {} }, [row, other]).removable).toBe(false)
})

it('does not change the DeepSeek account or other provider rows', () => {
  for (const provider of ['deepseek-account', 'openai-codex', 'local']) {
    const row = { ...api(), entry: { ...api().entry, provider } }
    expect(actions.deepSeekApiRow(row, { user: {} }, [row])).toBe(row)
  }
})

it('keeps the existing row when credential metadata or its namespace is unavailable', () => {
  const row = api()
  delete row.credential
  expect(actions.deepSeekApiRow(row, { user: {} }, [row])).toBe(row)
  expect(actions.deepSeekApiRow(api(), undefined, [row])).toMatchObject({ configured: true, removable: false })
})

function removal() {
  const row = api()
  const target = actions.targetOf(actions.deepSeekApiRow(row, { user: {} }, [row]))
  const operations = { removeCredential: vi.fn(async (): Promise<string | undefined> => undefined),
    writeSettings: vi.fn(async (): Promise<{ kind: 'written' } | { kind: 'refused'; message: string }> => ({ kind: 'written' })) }
  const controller = { load: vi.fn(async () => {}) }
  return { target, operations, controller }
}

it('uses the existing credential and settings operations, then refreshes the page', async () => {
  const { target, operations, controller } = removal()
  expect(await actions.removeProviderProfile(operations, controller, target)).toBeUndefined()
  expect(operations.removeCredential).toHaveBeenCalledExactlyOnceWith('DEEPSEEK_API_KEY')
  expect(operations.writeSettings).toHaveBeenCalledExactlyOnceWith('llm-deepseek', [{ op: 'unset', path: [] }], undefined)
  expect(controller.load).toHaveBeenCalledOnce()
})

it('reports credential removal failure without resetting settings', async () => {
  const { target, operations, controller } = removal()
  operations.removeCredential.mockResolvedValue('Credential write denied')
  expect(await actions.removeProviderProfile(operations, controller, target)).toBe('Credential write denied')
  expect(operations.writeSettings).not.toHaveBeenCalled()
  expect(controller.load).not.toHaveBeenCalled()
})

it('reports settings failure instead of claiming deletion succeeded', async () => {
  const { target, operations, controller } = removal()
  operations.writeSettings.mockResolvedValue({ kind: 'refused', message: 'Settings write denied' })
  expect(await actions.removeProviderProfile(operations, controller, target)).toBe('Settings write denied')
  expect(controller.load).not.toHaveBeenCalled()
})
