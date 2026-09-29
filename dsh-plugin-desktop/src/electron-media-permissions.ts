/** Next's microphone permission policy adapted to Desktop's loopback renderer. */
import type { Session, WebContents } from 'electron'
import type { NativePermissions } from './native-permissions.ts'

/** Connect Chromium audio requests to the same native consent owner as settings. */
export function installMicrophonePermissions(session: Session, permissions: NativePermissions, options: {
  renderer(): WebContents | undefined
  focused(): boolean
  origin: string
  warn(error: unknown): void
}): () => void {
  const trusted = (contents: WebContents | null, url: string, isMainFrame: boolean): boolean => {
    const owner = options.renderer()
    if (!owner || owner.isDestroyed() || owner !== contents || !isMainFrame) return false
    try { return new URL(url).origin === options.origin && new URL(owner.getURL()).origin === options.origin } catch { return false }
  }
  session.setPermissionCheckHandler((contents, permission, origin, details) => {
    if (!trusted(contents, origin, details.isMainFrame)) return false
    if (permission === 'media') return details.mediaType === 'audio' && permissions.query('microphone').status === 'granted'
    return true
  })
  session.setPermissionRequestHandler((contents, permission, callback, details) => {
    let replied = false
    const reply = (allowed: boolean): void => {
      if (replied) return
      replied = true
      try { callback(allowed) } catch (error) { options.warn(error) }
    }
    const allowed = (): boolean => trusted(contents, details.requestingUrl, details.isMainFrame)
    if (!allowed()) return reply(false)
    if (permission !== 'media') return reply(true)
    const mediaTypes = 'mediaTypes' in details ? details.mediaTypes : undefined
    if (!mediaTypes?.length || mediaTypes.some(type => type !== 'audio') || !options.focused()) return reply(false)
    void (async () => {
      if (!await contents.executeJavaScript('navigator.userActivation.isActive') || !allowed()) return false
      const result = await permissions.request('microphone')
      return allowed() && (result.status === 'granted' || process.platform === 'linux' && result.status === 'unknown')
    })().then(reply, error => { options.warn(error); reply(false) })
  })
  return () => {
    session.setPermissionCheckHandler(null)
    session.setPermissionRequestHandler(null)
  }
}
