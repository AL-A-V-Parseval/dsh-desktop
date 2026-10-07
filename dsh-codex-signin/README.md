# dsh-codex-signin

Desktop-bundled plugin that adds the **subscription (OAuth) sign-in entry** to
the Models settings page, under every provider that ships one.

Started as the ChatGPT/Codex entry and kept its name; it now covers the whole
set: `anthropic`, `openai-codex`, `github-copilot`, `xai`, `kimi-coding`,
`meta`, `openrouter` and `radius`.

## Why it exists

`@deepseek-ai/dsh-llm-pi-ai` already registers an authorization flow for every
installed pi-ai provider that ships a login, and DSH's own credential plane
stores the resulting grant under `llm-pi-ai/<provider>`. What the Models page
lacked was a way to *start* those flows: its provider editor renders API-key
fields only, so an OAuth grant could not be created from the UI.

This package supplies the missing seat, in two halves:

| Half | Role |
|---|---|
| `host/index.js` | Serves `/dsh-codex-signin/{state,start,answer,cancel}?provider=<id>` and drives `authorization.begin({ key: 'llm-pi-ai/<id>', method: 'oauth' })`. The flow owns the credential — this half never writes the store. |
| `lib/client.js` | Watches for the sign-in mount nodes inside the provider editor and mounts a plain-DOM card per provider (status, link, device code, prompt answer, cancel, "already signed in" state). |

The mount node itself comes from a vendored-runtime patch the launcher applies:
`patches/dsh-client-ui-settings-models@<runtime>.patch` renders

```jsx
{OAUTH_SIGNIN_PROVIDERS.includes(props.provider)
  ? <div data-dsh-codex-signin="mount" data-provider={props.provider} />
  : null}
```

inside `ProviderEditor`. Without that patch the card simply never mounts; the
plugin stays inert.

## Interaction relay

`dsh-llm-pi-ai` restates pi-ai's prompts as `{ kind: select|secret|text }` and
its notices as `{ message, url?, code? }`. The host displays notices as they
arrive and answers prompts two ways:

- `select` — answered host-side. Every flow that asks one offers a device-code
  path beside its browser path, and a settings card has no seat for a picker, so
  the device-code option wins (otherwise the first option).
- `text` — parked until the card answers, because it carries something only the
  human has: a pasted redirect URL (Anthropic, OpenRouter, ChatGPT), or the
  GitHub Enterprise domain (blank for github.com).

## Flow

1. Settings → Models → the provider row → **编辑**.
2. The card appears under the API-key field: **开始登录**.
3. Follow the link with the device code or the browser callback; paste a code
   back into the card when it asks for one.
4. After approval the flow commits the grant; the card shows the account id and
   expiry.
5. The provider is usable as soon as its route exists in
   `cordis.patch.yml` — an empty route (`provider: {}`) serves the catalog.

## Notes

- `openai` is deliberately not covered although it advertises the same ChatGPT
  subscription login: its flow requires a `getDeviceId` callback, and
  `dsh-llm-pi-ai` calls `models.login` without that argument, so its OAuth could
  only ever fail. The ChatGPT subscription is served by `openai-codex` (device
  code); the `openai` route remains available to an API key through the
  editor's own field.
- Flows that host a browser callback (Anthropic on `localhost:53692`, OpenRouter
  and ChatGPT) start their listener inside the host process, so completing the
  link in the renderer's browser works when the port is free; the parked prompt
  is the fallback when it is not.
- Using a subscription plan through a third-party client is a grey area with
  respect to each vendor's terms; the capability ships with the upstream
  dependency (`pi-ai`), and this package only surfaces the entry.
