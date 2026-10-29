import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBuiltinModels, getBuiltinModelDataGeneratedAt } from '@earendil-works/pi-ai/providers/all'
import { expect, it } from 'vitest'

it('keeps the provider OAuth mount in the settings package selected by this runtime', () => {
  const root = dirname(fileURLToPath(import.meta.resolve('@deepseek-ai/dsh-client-ui-settings-models')))
  expect(readFileSync(join(root, 'client.js'), 'utf8')).toContain('"data-dsh-codex-signin": "mount"')
})

it('ships the refreshed public catalog without replacing the protocol/OAuth runtime', () => {
  const root = dirname(fileURLToPath(import.meta.resolve('@earendil-works/pi-ai')))
  const version = JSON.parse(readFileSync(join(root, '..', 'package.json'), 'utf8')).version as string
  expect(['1.1.0', '1.4.0']).toContain(version)
  const receiptName = version === '1.1.0' ? 'pi-model-catalog.json' : `pi-model-catalog-${version}.json`
  const receipt = JSON.parse(readFileSync(new URL(`../../${receiptName}`, import.meta.url), 'utf8'))
  expect(version).toBe(receipt.runtimeVersion)
  expect(getBuiltinModelDataGeneratedAt()).toBe(Date.parse(receipt.catalogGeneratedAt))
  expect(getBuiltinModels('google').some(model => model.id === 'gemini-4-argon')).toBe(true)
  expect(getBuiltinModels('openai-codex').some(model => model.id === 'gpt-6.1-sol')).toBe(true)
  for (const provider of ['openai', 'openai-codex'] as const) {
    const terra = getBuiltinModels(provider).find(model => model.id === 'gpt-6.1-terra')
    expect(terra?.name).toBe('GPT-6.1 Terra')
    expect(terra?.contextWindow).toBe(provider === 'openai-codex' ? 500000 : 272000)
    expect(terra?.maxTokens).toBe(128000)
    expect(terra?.thinkingLevelMap?.off).toBe('none')
  }
  const manifest = JSON.parse(readFileSync(join(root, 'providers/data/.manifest.json'), 'utf8'))
  for (const [file, digest] of Object.entries(manifest.files)) {
    expect(createHash('sha256').update(readFileSync(join(root, 'providers/data', file))).digest('hex')).toBe(digest)
  }
  const patch = readFileSync(new URL(`../../patches/pi-ai@${version}.patch`, import.meta.url), 'utf8')
  expect(createHash('sha256').update(patch).digest('hex')).toBe(receipt.patchSha256)
  // Completion-event parsing is required. Reject only the old incremental parsing
  // hunks, not every call to parseStreamingJson in the provider implementation.
  for (const section of patch.split('# Desktop data-only model catalog refresh\n')[0]!.split(/^diff --git /mu).slice(1)) {
    const file = section.slice(2, section.indexOf(' '))
    const installed = readFileSync(join(root, '..', file), 'utf8')
    for (const hunk of section.split(/^@@ [^\n]*\n/mu).slice(1)) {
      const lines = hunk.split('\n').filter(line => /^[ +-]/u.test(line))
      const before = lines.filter(line => !line.startsWith('+')).map(line => line.slice(1)).join('\n')
      const after = lines.filter(line => !line.startsWith('-')).map(line => line.slice(1)).join('\n')
      expect(before).toMatch(/parseStreamingJson\(/u)
      expect(installed, file).toContain(after)
      expect(installed, file).not.toContain(before)
    }
  }
  expect(createHash('sha256').update(readFileSync(new URL('../../pi-model-catalog-additions.json', import.meta.url))).digest('hex')).toBe(receipt.additionsSha256)
})
