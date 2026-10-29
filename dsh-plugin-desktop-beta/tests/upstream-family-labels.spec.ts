import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, it } from 'vitest'
import { OFFICIAL_PLUGIN_INDEX } from '../src/upstream-family-labels.ts'

const require = createRequire(import.meta.url)
const meta = (locale: 'zh' | 'en'): { title?: unknown; description?: unknown } => JSON.parse(readFileSync(
  require.resolve(`@deepseek-ai/dsh-experimental-plugin-market-bundle/locale/${locale}.json`), 'utf8')).meta

it('names the official plugin index bundle exactly as the installed release does', () => {
  for (const locale of ['zh', 'en'] as const) {
    expect(meta(locale).title, locale).toBe(OFFICIAL_PLUGIN_INDEX.title[locale])
    expect(meta(locale).description, locale).toBe(OFFICIAL_PLUGIN_INDEX.description[locale])
  }
})
