/**
 * Host half of the Codex sign-in entry.
 *
 * DSH's `dsh-llm-pi-ai` adapter already registers an authorization flow for
 * every installed pi-ai provider that ships a login, `openai-codex` included —
 * but the Models page only renders API-key fields, so nothing in the UI starts
 * it. This plugin only supplies the missing seat: the Models settings page
 * renders a card from `lib/client.js`, and this half drives the real flow:
 *
 *     authorization.begin({ key: 'llm-pi-ai/openai-codex', method: 'oauth' })
 *
 * The flow itself owns the credential: when it settles, `dsh-llm-pi-ai` has
 * written the grant into the harness credential store exactly as if the
 * upstream UI had launched it. This half never touches the store, it only
 * reports state.
 *
 * Interaction relay: `dsh-llm-pi-ai` restates pi-ai's prompts/notices into the
 * seam vocabulary (`prompt.kind` = select|secret|text, `notice` =
 * { message, url?, code? }). The device-code path needs one answer — "use
 * device_code" — and everything else arrives as notices to display.
 */

export const name = 'dsh-codex-signin'

/** Route prefix this plugin owns. */
const ROUTE_PREFIX = '/dsh-codex-signin'
/** The pi-ai provider whose flow this entry drives. */
export const PROVIDER = 'openai-codex'
/** Its credential/flow address inside the harness credential plane. */
const FLOW_KEY = `llm-pi-ai/${PROVIDER}`
/** Terminal states never accept another start; a fresh press restarts them. */
const TERMINAL = new Set(['authorized', 'cancelled', 'failed'])

/**
 * Build the plugin's host surface.
 * @param ctx - host plugin context.
 */
export function apply(ctx) {
  /** One attempt per process: a second flow for the same key is refused by the service. */
  let attempt

  const publicState = () => ({
    provider: PROVIDER,
    status: attempt?.status ?? 'idle',
    message: attempt?.message ?? null,
    url: attempt?.url ?? null,
    code: attempt?.code ?? null,
    error: attempt?.error ?? null,
    startedAt: attempt?.startedAt ?? null,
    finishedAt: attempt?.finishedAt ?? null,
  })

  const sendJson = (res, status, body) => {
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(text),
    })
    res.end(text)
  }

  // Services are read lazily off the plugin's own context: the injected scope
  // only resolves what its declaration names, and the credential plane may
  // mount after this plugin does.
  const service = name => {
    try {
      return ctx.get(name)
    } catch {
      return undefined
    }
  }

  ctx.inject(['webServer'], scope => {
    const warn = message => ctx.logger?.warn?.(`dsh-codex-signin: ${message}`)

    /** Report the stored grant beside the live attempt, so the card can say "已登录". */
    const snapshot = async () => {
      const state = publicState()
      const credentials = service('credentials')
      if (credentials?.readRecord === undefined) return { ...state, stored: null, storage: 'unavailable' }
      try {
        const record = await credentials.readRecord(FLOW_KEY)
        const payload = record?.kind === 'grant' ? record.payload : undefined
        return {
          ...state,
          storage: 'ok',
          stored: payload === undefined ? null : {
            accountId: typeof payload.accountId === 'string' ? payload.accountId : null,
            expires: typeof payload.expires === 'number' ? payload.expires : null,
          },
        }
      } catch (error) {
        warn(`reading ${FLOW_KEY} failed — ${error instanceof Error ? error.message : String(error)}`)
        return { ...state, stored: null, storage: 'error' }
      }
    }

    const start = () => {
      if (attempt !== undefined && !TERMINAL.has(attempt.status)) return
      const authorization = service('authorization')
      if (authorization?.begin === undefined) {
        attempt = { status: 'failed', error: 'authorization service is unavailable in this host', startedAt: Date.now() }
        return
      }
      const state = {
        status: 'pending',
        message: '正在向 OpenAI 申请设备码…',
        url: null,
        code: null,
        error: null,
        startedAt: Date.now(),
      }
      attempt = state
      const controller = new AbortController()
      state.controller = controller
      // The flow resolves only when the human finishes (or withdraws) it, so
      // the request that started it must not wait on it: the card polls state.
      authorization.begin({
        key: FLOW_KEY,
        method: 'oauth',
        signal: controller.signal,
        interaction: {
          notify: notice => {
            if (notice === null || typeof notice !== 'object') return
            if (typeof notice.message === 'string') state.message = notice.message
            if (typeof notice.url === 'string') state.url = notice.url
            if (typeof notice.code === 'string') state.code = notice.code
          },
          prompt: async prompt => {
            // pi-ai asks which login method to use. This surface implements the
            // headless device-code path only, because the browser path needs a
            // callback on localhost:1455 inside the renderer's machine.
            if (prompt?.kind === 'select') {
              const options = Array.isArray(prompt.options) ? prompt.options : []
              const chosen = options.find(option => option?.id === 'device_code') ?? options[0]
              if (chosen?.id !== undefined) return chosen.id
            }
            throw new Error(`unsupported prompt ${JSON.stringify(prompt)}`)
          },
        },
      }).then(outcome => {
        state.status = outcome?.status === 'authorized' ? 'authorized' : 'cancelled'
        state.finishedAt = Date.now()
      }, error => {
        state.status = 'failed'
        state.error = error instanceof Error ? error.message : String(error)
        state.finishedAt = Date.now()
        warn(`flow failed — ${state.error}`)
      })
    }

    const cancel = () => {
      const controller = attempt?.controller
      if (controller !== undefined && !controller.signal.aborted) {
        controller.abort(new Error('cancelled by the user'))
        if (attempt !== undefined) attempt.status = 'cancelled'
      }
    }

    const handler = async (req, res) => {
      const sub = new URL(req.url ?? '/', 'http://x').pathname.slice(ROUTE_PREFIX.length) || '/'
      try {
        if (req.method === 'GET' && (sub === '/' || sub === '/state')) return sendJson(res, 200, await snapshot())
        if (req.method === 'POST' && sub === '/start') {
          start()
          return sendJson(res, 202, await snapshot())
        }
        if (req.method === 'POST' && sub === '/cancel') {
          cancel()
          return sendJson(res, 200, await snapshot())
        }
        return sendJson(res, 404, { error: 'not found' })
      } catch (error) {
        warn(`request failed — ${error instanceof Error ? error.message : String(error)}`)
        return sendJson(res, 500, { error: 'internal error' })
      }
    }

    try {
      scope.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler })
    } catch (error) {
      // A host without a free prefix still boots: the card simply reports the
      // missing surface instead of taking the plugin (and its client half) down.
      warn(`route registration refused — ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
