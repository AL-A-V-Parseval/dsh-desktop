/**
 * Client half of the Codex sign-in entry.
 *
 * The entry lives inside the Models settings page's "add provider" dialog,
 * under the provider `openai-codex`. That dialog is a bundled React component
 * with no slot of its own, so a one-line local patch to
 * `@deepseek-ai/dsh-client-ui-settings-models` renders an empty mount node:
 *
 *     <div data-dsh-codex-signin="mount" />
 *
 * (see scripts/patch-models-dialog-codex-signin.sh). This half watches for that
 * node and mounts a plain-DOM card into it — no ReactDOM needed, and the card
 * disappears with the dialog because it lives inside the dialog's own subtree.
 *
 * Everything stateful comes from the host half's `/dsh-codex-signin/*` routes.
 */
window.__ModuleLoader__.load({
  id: 'dsh-codex-signin',
  factory: () => {
    'use strict'
    var module = { exports: {} }
    var exports = module.exports

    const MOUNT_SELECTOR = '[data-dsh-codex-signin="mount"]'
    const ROOT_ATTR = 'data-dsh-codex-signin-root'
    const BASE = '/dsh-codex-signin'
    const POLL_MS = 2500

    const COPY = {
      title: '用 ChatGPT 订阅登录',
      description: '走 OpenAI 官方 OAuth（设备码），凭据由 DSH 存到 llm-pi-ai/openai-codex。登录后再点下面的「保存」把该提供商加入配置。',
      start: '开始登录',
      restart: '重新登录',
      cancel: '取消',
      copy: '复制代码',
      copied: '已复制',
      open: '打开授权页面',
      signedIn: '已登录',
      working: '处理中…',
      stale: '授权已返回，等待凭据落盘…',
    }

    const style = {
      card: {
        display: 'flex', flexDirection: 'column', gap: '8px',
        marginTop: '10px', padding: '12px 14px',
        border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.25))',
        borderRadius: '10px',
        background: 'var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.08))',
        color: 'var(--dsw-alias-label-primary, inherit)',
        fontSize: '13px', lineHeight: '20px',
      },
      title: { fontSize: '13px', fontWeight: '600' },
      muted: { color: 'var(--dsw-alias-label-tertiary, #8f8a7e)', fontSize: '12px', lineHeight: '18px' },
      row: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
      button: {
        appearance: 'none', cursor: 'pointer', font: 'inherit',
        padding: '4px 11px', borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.3))',
        background: 'var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.12))',
        color: 'inherit',
      },
      primary: {
        appearance: 'none', cursor: 'pointer', font: 'inherit',
        padding: '4px 12px', borderRadius: '8px', border: '1px solid transparent',
        background: 'var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary, #4d6bfe))',
        color: '#fff',
      },
      code: {
        fontFamily: 'var(--dsw-font-code, ui-monospace, monospace)',
        fontSize: '15px', fontWeight: '600', letterSpacing: '1px',
        padding: '4px 9px', borderRadius: '7px',
        background: 'var(--dsw-alias-bg-layer-2, rgba(128,128,128,0.16))',
      },
      link: { color: 'var(--dsw-alias-link, #4d6bfe)' },
      error: { color: 'var(--dsw-alias-state-error-primary, #c0392b)', fontSize: '12px' },
      success: { color: 'var(--dsw-alias-state-success-primary, #2ea44f)' },
    }

    const el = (tag, css, text) => {
      const node = document.createElement(tag)
      if (css !== undefined) Object.assign(node.style, css)
      if (text !== undefined) node.textContent = text
      return node
    }

    async function request(path, init) {
      const response = await fetch(`${BASE}${path}`, { credentials: 'same-origin', ...init })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    }

    /**
     * One card instance. Disposes itself once its node leaves the document, so
     * a dialog that closes and reopens cannot leave a poller behind.
     * @returns the card node.
     */
    function createCard() {
      let state = { status: 'loading' }
      let busy = false
      let copied = false
      let localError = null
      let disposed = false

      const root = el('div', style.card)
      root.setAttribute(ROOT_ATTR, '')

      const title = el('div', style.title, COPY.title)
      const description = el('div', style.muted, COPY.description)
      const status = el('div', style.row)
      const actions = el('div', style.row)
      const extra = el('div', style.row)
      root.append(title, description, status, actions, extra)

      const cancelTimer = started => {
        const button = el('button', style.button, COPY.cancel)
        button.type = 'button'
        button.disabled = busy
        button.onclick = async () => { await post('/cancel') }
        return button
      }

      const render = () => {
        status.replaceChildren()
        actions.replaceChildren()
        extra.replaceChildren()

        const stored = state.stored
        const signedIn = stored !== null && stored !== undefined
        if (signedIn) {
          const line = el('div', style.row)
          line.append(el('span', style.success, '●'))
          line.append(el('span', undefined, COPY.signedIn + (stored.accountId ? `（账号 ${stored.accountId}）` : '')))
          if (typeof stored.expires === 'number') {
            line.append(el('span', style.muted, `凭据有效至 ${new Date(stored.expires).toLocaleString()}`))
          }
          status.append(line)
        }

        if (state.status === 'pending') {
          status.append(el('div', style.muted, state.message || '等待授权…'))
          if (typeof state.url === 'string' && state.url.length > 0) {
            const link = el('a', style.link, COPY.open)
            link.href = state.url
            link.target = '_blank'
            link.rel = 'noreferrer'
            extra.append(link, el('span', style.muted, state.url))
          }
          if (typeof state.code === 'string' && state.code.length > 0) {
            const code = state.code
            const copy = el('button', style.button, copied ? COPY.copied : COPY.copy)
            copy.type = 'button'
            copy.onclick = () => {
              navigator.clipboard?.writeText(code).then(() => {
                copied = true
                render()
                setTimeout(() => { copied = false; render() }, 1600)
              }, () => { localError = '复制失败，请手动选中代码'; render() })
            }
            extra.append(el('code', style.code, code), copy)
          }
          actions.append(cancelTimer())
        } else {
          const button = el('button', style.primary, busy ? COPY.working : (signedIn ? COPY.restart : COPY.start))
          button.type = 'button'
          button.disabled = busy
          button.onclick = () => post('/start')
          actions.append(button)
        }

        if (state.status === 'failed' && typeof state.error === 'string') status.append(el('div', style.error, state.error))
        if (state.status === 'authorized' && !signedIn) status.append(el('div', style.muted, COPY.stale))
        if (localError !== null) status.append(el('div', style.error, localError))
      }

      const load = async () => {
        try {
          state = await request('/state')
          localError = null
        } catch (error) {
          localError = error instanceof Error ? error.message : String(error)
        }
        render()
      }

      const post = async path => {
        busy = true
        render()
        try {
          state = await request(path, { method: 'POST' })
          localError = null
        } catch (error) {
          localError = error instanceof Error ? error.message : String(error)
        } finally {
          busy = false
          render()
        }
      }

      const timer = setInterval(() => {
        if (disposed) return
        if (!root.isConnected) { disposed = true; clearInterval(timer); return }
        if (!document.hidden) load()
      }, POLL_MS)

      render()
      void load()
      return root
    }

    /**
     * Mount a card into every sign-in node the (patched) provider dialog
     * renders, and keep doing it as the dialog re-renders.
     */
    function apply() {
      const sweep = () => {
        for (const mount of document.querySelectorAll(MOUNT_SELECTOR)) {
          if (mount.querySelector(`[${ROOT_ATTR}]`) !== null) continue
          mount.appendChild(createCard())
        }
      }
      const observer = new MutationObserver(sweep)
      observer.observe(document.body, { childList: true, subtree: true })
      sweep()
    }

    exports.apply = apply
    return module.exports
  },
})
