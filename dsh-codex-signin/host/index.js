/**
 * Host half of the subscription sign-in entry.
 *
 * DSH's `dsh-llm-pi-ai` adapter registers an authorization flow for every
 * installed pi-ai provider that ships an OAuth login — the ChatGPT, Claude
 * Pro/Max, Copilot, SuperGrok, Kimi Code, Meta, OpenRouter and Radius routes
 * included — but the Models page only renders API-key fields, so nothing in the
 * UI starts any of them. This plugin supplies the missing seat: the Models
 * settings page renders one card per provider from `lib/client.js`, and this
 * half drives the real flow:
 *
 *     authorization.begin({ key: 'llm-pi-ai/<provider>', method: 'oauth' })
 *
 * The flow itself owns the credential: when it settles, `dsh-llm-pi-ai` has
 * written the grant into the harness credential store exactly as if the
 * upstream UI had launched it. This half never touches the store, it only
 * reports state.
 *
 * Interaction relay: `dsh-llm-pi-ai` restates pi-ai's prompts/notices into the
 * seam vocabulary (`prompt.kind` = select|secret|text, `notice` =
 * { message, url?, code? }). Notices are displayed as they arrive. A `select`
 * prompt is answered here — every flow that asks one offers a device-code path
 * and a browser path, and the card has no seat for a picker — while a
 * `text`/`secret` prompt is parked for the card to answer, because those carry
 * something only the human has: a pasted redirect URL, or the GitHub Enterprise
 * domain (blank for github.com).
 */

export const name = 'dsh-codex-signin'

/** Route prefix this plugin owns. */
const ROUTE_PREFIX = '/dsh-codex-signin'

/**
 * The pi-ai providers whose OAuth login this entry exposes, keyed by route id.
 * Each ships `auth.oauth`, so `dsh-llm-pi-ai` already registers the flow; the
 * label is what the card titles itself with.
 *
 * `openai` is deliberately absent although it advertises the same ChatGPT
 * subscription login. Its flow refuses to start without a `getDeviceId`
 * callback, and `dsh-llm-pi-ai` calls `models.login` without that fourth
 * argument, so a card for it could only ever report that error. The ChatGPT
 * subscription is served by `openai-codex`, which runs a device-code flow; the
 * `openai` route stays available to an API key through the editor's own field.
 */
export const PROVIDERS = Object.freeze({
  anthropic: 'Claude Pro/Max',
  'openai-codex': 'ChatGPT Plus/Pro',
  'github-copilot': 'GitHub Copilot',
  xai: 'SuperGrok / X Premium',
  'kimi-coding': 'Kimi Code',
  meta: 'Meta',
  openrouter: 'OpenRouter',
  radius: 'Radius',
})

/** Terminal states never accept another start; a fresh press restarts them. */
const TERMINAL = new Set(['authorized', 'cancelled', 'failed'])

/** Cap on an answered prompt's body; a pasted redirect URL is the largest one. */
const MAX_BODY_BYTES = 64 * 1024

/**
 * Build the plugin's host surface.
 * @param ctx - host plugin context.
 */
export function apply(ctx) {
  /** One live attempt per provider: a second flow for the same key is refused by the service. */
  const attempts = new Map()

  const publicState = provider => {
    const attempt = attempts.get(provider)
    const prompt = attempt?.prompt
    return {
      provider,
      label: PROVIDERS[provider] ?? provider,
      status: attempt?.status ?? 'idle',
      message: attempt?.message ?? null,
      url: attempt?.url ?? null,
      code: attempt?.code ?? null,
      error: attempt?.error ?? null,
      prompt: prompt === undefined
        ? null
        : { kind: prompt.kind, message: prompt.message, placeholder: prompt.placeholder ?? null },
      startedAt: attempt?.startedAt ?? null,
      finishedAt: attempt?.finishedAt ?? null,
    }
  }

  const sendJson = (res, status, body) => {
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(text),
    })
    res.end(text)
  }

  const readBody = req => new Promise(resolve => {
    let data = ''
    let overflowed = false
    req.on('data', chunk => {
      data += chunk
      if (data.length > MAX_BODY_BYTES) {
        overflowed = true
        req.destroy()
      }
    })
    req.on('end', () => {
      if (overflowed) return resolve({})
      try {
        resolve(JSON.parse(data === '' ? '{}' : data))
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })

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
    const snapshot = async provider => {
      const state = publicState(provider)
      const credentials = service('credentials')
      if (credentials?.readRecord === undefined) return { ...state, stored: null, storage: 'unavailable' }
      try {
        const record = await credentials.readRecord(`llm-pi-ai/${provider}`)
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
        warn(`reading llm-pi-ai/${provider} failed — ${error instanceof Error ? error.message : String(error)}`)
        return { ...state, stored: null, storage: 'error' }
      }
    }

    const start = provider => {
      const running = attempts.get(provider)
      if (running !== undefined && !TERMINAL.has(running.status)) return
      const authorization = service('authorization')
      if (authorization?.begin === undefined) {
        attempts.set(provider, {
          status: 'failed',
          error: 'authorization service is unavailable in this host',
          startedAt: Date.now(),
        })
        return
      }
      const state = {
        status: 'pending',
        message: `正在向 ${PROVIDERS[provider] ?? provider} 申请授权…`,
        url: null,
        code: null,
        error: null,
        prompt: undefined,
        startedAt: Date.now(),
      }
      attempts.set(provider, state)
      const controller = new AbortController()
      state.controller = controller
      // The flow resolves only when the human finishes (or withdraws) it, so
      // the request that started it must not wait on it: the card polls state.
      authorization.begin({
        key: `llm-pi-ai/${provider}`,
        method: 'oauth',
        signal: controller.signal,
        interaction: {
          notify: notice => {
            if (notice === null || typeof notice !== 'object') return
            if (typeof notice.message === 'string') state.message = notice.message
            if (typeof notice.url === 'string') state.url = notice.url
            if (typeof notice.code === 'string') state.code = notice.code
          },
          prompt: prompt => {
            // Every flow that asks a `select` offers a device-code path beside
            // its browser path, and that is the one a settings card can finish
            // without commanding the renderer's browser. Anything else is
            // something only the human holds; park it until the card answers.
            if (prompt?.kind === 'select') {
              const options = Array.isArray(prompt.options) ? prompt.options : []
              const chosen = options.find(option => /device/i.test(String(option?.id ?? ''))) ?? options[0]
              if (chosen?.id !== undefined) return Promise.resolve(chosen.id)
              throw new Error(`unsupported prompt ${JSON.stringify(prompt)}`)
            }
            const kind = prompt?.kind === 'secret' ? 'secret' : 'text'
            if (kind === 'secret') {
              // A `secret` here is an interactively collected API key, which
              // this card does not offer: every provider it lists has an OAuth
              // login, and the flow is always begun with `method: 'oauth'`.
              throw new Error(`unsupported prompt ${JSON.stringify(prompt)}`)
            }
            return new Promise((resolve, reject) => {
              const parked = { kind, message: prompt?.message ?? '', placeholder: prompt?.placeholder, settle: resolve }
              state.prompt = parked
              const signal = prompt?.signal
              if (signal !== undefined) {
                const withdraw = () => {
                  if (state.prompt === parked) state.prompt = undefined
                  reject(new Error('sign-in cancelled'))
                }
                if (signal.aborted) withdraw()
                else signal.addEventListener('abort', withdraw, { once: true })
              }
            })
          },
        },
      }).then(outcome => {
        state.status = outcome?.status === 'authorized' ? 'authorized' : 'cancelled'
        state.prompt = undefined
        state.finishedAt = Date.now()
      }, error => {
        state.status = 'failed'
        state.error = error instanceof Error ? error.message : String(error)
        state.prompt = undefined
        state.finishedAt = Date.now()
        warn(`${provider} flow failed — ${state.error}`)
      })
    }

    const answer = (provider, value) => {
      const state = attempts.get(provider)
      const parked = state?.prompt
      if (parked === undefined) return false
      state.prompt = undefined
      parked.settle(typeof value === 'string' ? value : '')
      return true
    }

    const cancel = provider => {
      const state = attempts.get(provider)
      const controller = state?.controller
      if (controller !== undefined && !controller.signal.aborted) {
        controller.abort(new Error('cancelled by the user'))
        state.status = 'cancelled'
        state.prompt = undefined
      }
    }

    const providerOf = url => {
      const query = new URL(url ?? '/', 'http://x').searchParams.get('provider') ?? ''
      return Object.prototype.hasOwnProperty.call(PROVIDERS, query) ? query : undefined
    }

    const handler = async (req, res) => {
      const sub = new URL(req.url ?? '/', 'http://x').pathname.slice(ROUTE_PREFIX.length) || '/'
      try {
        const provider = providerOf(req.url)
        if (provider === undefined) return sendJson(res, 404, { error: 'unknown provider' })
        if (req.method === 'GET' && (sub === '/' || sub === '/state')) return sendJson(res, 200, await snapshot(provider))
        if (req.method === 'POST' && sub === '/start') {
          start(provider)
          return sendJson(res, 202, await snapshot(provider))
        }
        if (req.method === 'POST' && sub === '/answer') {
          const body = await readBody(req)
          const accepted = answer(provider, body?.value)
          return sendJson(res, accepted ? 200 : 409, await snapshot(provider))
        }
        if (req.method === 'POST' && sub === '/cancel') {
          cancel(provider)
          return sendJson(res, 200, await snapshot(provider))
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
