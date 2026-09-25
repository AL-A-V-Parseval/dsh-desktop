import { afterEach, expect, it, vi } from 'vitest'
import { registerDesktopOnboarding } from '../../dsh-plugin-desktop-beta/src/client/onboarding.tsx'

const hooks = vi.hoisted(() => ({ values: [] as unknown[], setters: [] as ReturnType<typeof vi.fn>[], effects: [] as (() => unknown)[] }))
// The shared coordinator resolves React and primitives from Beta's workspace.
// Mock those module identities rather than Next's separate installed copies.
vi.mock('../../dsh-plugin-desktop-beta/node_modules/react/index.js', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: () => {
    const setter = vi.fn()
    hooks.setters.push(setter)
    return [hooks.values.shift(), setter]
  },
  useEffect: (effect: () => unknown) => { hooks.effects.push(effect) },
}))
vi.mock('../../dsh-plugin-desktop-beta/node_modules/@deepseek-ai/dsh-client-ui-primitives/lib/index.js', () => ({ Button: 'button', Toast: 'official-toast' }))
afterEach(() => { vi.unstubAllGlobals() })

function fixture(snapshotOverrides: Record<string, unknown> | null = {}) {
  const snapshot = snapshotOverrides === null ? null
    : { profile: 'work', required: true, edition: 'desktop', restartPending: false, input: { platform: 'darwin' }, ...snapshotOverrides }
  hooks.values = [snapshot, '', 0, false]; hooks.setters = []; hooks.effects = []
  const bridge = { read: vi.fn(async (): Promise<any> => snapshot), finish: vi.fn(async () => {}), applyPending: vi.fn(async () => {}) }
  vi.stubGlobal('window', { dshDesktopSetup: bridge })
  let Component: (props: any) => any = () => null
  const ctx = { slots: {
    inject: (_name: string, callback: () => void) => callback(),
    register: (_options: unknown, component: typeof Component) => { Component = component },
  } }
  const content = vi.fn((..._args: any[]) => 'Original wizard')
  registerDesktopOnboarding(ctx as any, content)
  const renderNext = vi.fn(() => 'Official introduction'), renderLoading = vi.fn(() => 'Loading')
  const result = Component({ bridge, content, zh: true, accountStatus: 'signed-out', openLogin: vi.fn(),
    renderNext, renderLoading, renderNavigation: vi.fn(), renderSurface: (value: unknown) => value })
  return { bridge, content, result, snapshot, renderNext }
}

it('shows the original Desktop wizard for a Profile that still needs setup', () => {
  const view = fixture()
  expect(view.content).toHaveBeenCalledOnce()
  expect(view.renderNext).not.toHaveBeenCalled()
})

it('never hands a finished Profile on to the official introduction', () => {
  const view = fixture(null)
  expect(view.result).toBeNull()
  expect(view.renderNext).not.toHaveBeenCalled()
})

it('ignores a sign-in continuation reported by an earlier Host', async () => {
  const view = fixture({ required: false, accountPending: true })
  hooks.effects[0]!()
  await vi.waitFor(() => expect(hooks.setters[0]).toHaveBeenCalledWith(null))
  expect(view.renderNext).not.toHaveBeenCalled()
})

it('offers the restart right after completion in the same renderer', async () => {
  const view = fixture()
  const next = { ...view.snapshot, required: false, restartPending: true }
  view.bridge.read.mockResolvedValue(next)
  await view.content.mock.calls[0]![2]('work', { market: 'disabled' })
  expect(view.bridge.finish).toHaveBeenCalledWith('work', { market: 'disabled' })
  expect(hooks.setters[0]).toHaveBeenCalledWith(next)
  expect(view.bridge.applyPending).not.toHaveBeenCalled()
})

it('opens the app directly after an explicit skip', async () => {
  const view = fixture()
  view.bridge.read.mockResolvedValue({ ...view.snapshot, required: false })
  await view.content.mock.calls[0]![2]('work')
  expect(hooks.setters[0]).toHaveBeenCalledWith(null)
})

it('retries reading after a successful save without submitting the wizard again', async () => {
  const view = fixture()
  view.bridge.read.mockRejectedValue(new Error('read failed'))
  await expect(view.content.mock.calls[0]![2]('work', {})).resolves.toBeUndefined()
  expect(hooks.setters[1]).toHaveBeenCalledWith('Error: read failed')
  expect(view.bridge.finish).toHaveBeenCalledOnce()
})

it('keeps Next waiting for its existing Host restart', async () => {
  const view = fixture({ edition: 'next' })
  await view.content.mock.calls[0]![2]('work', {})
  expect(hooks.setters[0]).toHaveBeenCalledWith(undefined)
  expect(view.bridge.read).not.toHaveBeenCalled()
})

it('applies saved settings only when the user explicitly requests the final restart', async () => {
  const view = fixture({ required: false, restartPending: true })
  expect(view.renderNext).not.toHaveBeenCalled()
  expect(view.bridge.applyPending).not.toHaveBeenCalled()
  expect(view.result.type).toBe('official-toast')
  view.result.props.actions[0].onClick()
  await vi.waitFor(() => expect(view.bridge.applyPending).toHaveBeenCalledExactlyOnceWith('work'))
})

it('dismisses the official toast without restarting or discarding saved settings', () => {
  const view = fixture({ required: false, restartPending: true })
  view.result.props.onDone()
  expect(hooks.setters[0]).toHaveBeenCalledWith(null)
  expect(view.bridge.applyPending).not.toHaveBeenCalled()
  expect(view.bridge.finish).not.toHaveBeenCalled()
})
