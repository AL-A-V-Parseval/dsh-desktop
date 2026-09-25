import { describe, expect, it, vi } from 'vitest'
import { markDocumentPlatform } from '../src/preload-platform.ts'

vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: vi.fn() },
  ipcRenderer: { invoke: vi.fn() },
  webUtils: { getPathForFile: vi.fn() },
}))

describe('Desktop preload platform marker', () => {
  it('publishes the marker from the actual renderer preload', async () => {
    const root = { dataset: {} as DOMStringMap }
    vi.stubGlobal('document', { documentElement: root })
    try {
      await import('../src/preload.ts')
      expect(root.dataset.platform).toBe(process.platform)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('marks an existing document root for official macOS menu materials', () => {
    const root = { dataset: {} as DOMStringMap }
    const doc = { documentElement: root, addEventListener: vi.fn() } as unknown as Document
    markDocumentPlatform(doc, 'darwin')
    expect(root.dataset.platform).toBe('darwin')
    expect(doc.addEventListener).not.toHaveBeenCalled()
  })

  it('waits for the document root when preload runs before it exists', () => {
    const root = { dataset: {} as DOMStringMap }
    const doc = { documentElement: null, addEventListener: vi.fn() } as unknown as Document
    markDocumentPlatform(doc, 'darwin')
    expect(doc.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function), { once: true })
    Object.defineProperty(doc, 'documentElement', { value: root })
    const mark = vi.mocked(doc.addEventListener).mock.calls[0]?.[1] as EventListener
    mark(new Event('DOMContentLoaded'))
    expect(root.dataset.platform).toBe('darwin')
  })
})
