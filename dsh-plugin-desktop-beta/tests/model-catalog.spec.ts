import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getBuiltinModels, getBuiltinModelDataGeneratedAt } from '@earendil-works/pi-ai/providers/all'
import { expect, it } from 'vitest'

it('ships the refreshed public catalog without replacing the protocol/OAuth runtime', () => {
  const receipt = JSON.parse(readFileSync(new URL('../../pi-model-catalog.json', import.meta.url), 'utf8'))
  const root = dirname(fileURLToPath(import.meta.resolve('@earendil-works/pi-ai')))
  expect(JSON.parse(readFileSync(join(root, '..', 'package.json'), 'utf8')).version).toBe(receipt.runtimeVersion)
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
  expect(createHash('sha256').update(readFileSync(new URL('../../patches/pi-ai@1.1.0.patch', import.meta.url))).digest('hex')).toBe(receipt.patchSha256)
  expect(createHash('sha256').update(readFileSync(new URL('../../pi-model-catalog-additions.json', import.meta.url))).digest('hex')).toBe(receipt.additionsSha256)
})
