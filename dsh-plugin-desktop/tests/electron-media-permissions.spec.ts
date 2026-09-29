import { expect, it, vi } from 'vitest'
import type { Session, WebContents } from 'electron'
import { installMicrophonePermissions } from '../src/electron-media-permissions.ts'
import type { NativePermissions } from '../src/native-permissions.ts'

function setup() {
  let check!: Parameters<Session['setPermissionCheckHandler']>[0]
  let request!: Parameters<Session['setPermissionRequestHandler']>[0]
  let live = true
  let focused = true
  const origin = 'http://127.0.0.1:41234'
  const renderer = {
    getURL: () => `${origin}/`, isDestroyed: () => false,
    executeJavaScript: vi.fn(async () => true),
  } as unknown as WebContents
  const permissions = {
    query: vi.fn(() => ({ status: 'not-determined' })), request: vi.fn(async () => ({ status: 'granted' })),
  }
  const session = {
    setPermissionCheckHandler: vi.fn((handler: typeof check) => { check = handler }),
    setPermissionRequestHandler: vi.fn((handler: typeof request) => { request = handler }),
  }
  const warn = vi.fn()
  const dispose = installMicrophonePermissions(session as unknown as Session, permissions as unknown as NativePermissions, {
    origin, renderer: () => live ? renderer : undefined, focused: () => focused, warn,
  })
  return { check: check!, request: request!, renderer, permissions, session, warn, dispose,
    details: { requestingUrl: `${origin}/`, isMainFrame: true, mediaTypes: ['audio'] },
    close: () => { live = false }, unfocus: () => { focused = false },
  }
}

it('uses Next consent rules for the trusted loopback renderer, without prompting on passive checks', async () => {
  const f = setup()
  expect(f.check(f.renderer, 'media', f.details.requestingUrl, { isMainFrame: true, mediaType: 'audio' })).toBe(false)
  expect(f.permissions.request).not.toHaveBeenCalled()
  const callback = vi.fn()
  f.request(f.renderer, 'media', callback, { ...f.details, requestingUrl: 'https://example.com/' })
  f.request(f.renderer, 'media', callback, { ...f.details, isMainFrame: false })
  f.request(f.renderer, 'media', callback, { ...f.details, mediaTypes: ['video'] })
  expect(callback.mock.calls).toEqual([[false], [false], [false]])
  expect(f.permissions.request).not.toHaveBeenCalled()
  f.request(f.renderer, 'media', callback, f.details)
  await vi.waitFor(() => expect(callback).toHaveBeenLastCalledWith(true))
  expect(f.permissions.request).toHaveBeenCalledExactlyOnceWith('microphone')
  f.permissions.query.mockReturnValue({ status: 'granted' })
  expect(f.check(f.renderer, 'media', f.details.requestingUrl, { isMainFrame: true, mediaType: 'audio' })).toBe(true)
})

it('requires both a user gesture and a focused Desktop for new audio consent', async () => {
  const f = setup()
  vi.mocked(f.renderer.executeJavaScript).mockResolvedValue(false)
  const callback = vi.fn()
  f.request(f.renderer, 'media', callback, f.details)
  await vi.waitFor(() => expect(callback).toHaveBeenCalledExactlyOnceWith(false))
  expect(f.permissions.request).not.toHaveBeenCalled()
  f.unfocus()
  f.request(f.renderer, 'media', callback, f.details)
  expect(callback).toHaveBeenCalledTimes(2)
  expect(f.permissions.request).not.toHaveBeenCalled()
})

it('rejects consent if the renderer closes during the system prompt', async () => {
  const f = setup()
  f.permissions.request.mockImplementationOnce(async () => { f.close(); return { status: 'granted' } })
  const callback = vi.fn()
  f.request(f.renderer, 'media', callback, f.details)
  await vi.waitFor(() => expect(callback).toHaveBeenCalledExactlyOnceWith(false))
})

it('settles a missing-frame callback once and removes both hooks when the shell is released', async () => {
  const f = setup()
  const callback = vi.fn(() => { throw new Error('Frame gone') })
  f.request(f.renderer, 'media', callback, f.details)
  await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce())
  expect(f.warn).toHaveBeenCalledOnce()
  f.dispose()
  expect(f.session.setPermissionCheckHandler).toHaveBeenLastCalledWith(null)
  expect(f.session.setPermissionRequestHandler).toHaveBeenLastCalledWith(null)
})
