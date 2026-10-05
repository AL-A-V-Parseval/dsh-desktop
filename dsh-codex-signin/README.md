# dsh-codex-signin

Desktop-bundled plugin that adds the **ChatGPT / Codex (OAuth) sign-in entry**
to the Models settings page, under the provider `openai-codex`.

## Why it exists

`@deepseek-ai/dsh-llm-pi-ai` already registers an authorization flow for every
installed pi-ai provider that ships a login, `openai-codex` included, and DSH's
own credential plane stores the resulting grant under `llm-pi-ai/openai-codex`.
What the Models page lacked was a way to *start* that flow: its provider dialog
renders API-key fields only, so the OAuth grant could not be created from the UI.

This package supplies the missing seat, in two halves:

| Half | Role |
|---|---|
| `host/index.js` | Serves `/dsh-codex-signin/{state,start,cancel}` and drives `authorization.begin({ key: 'llm-pi-ai/openai-codex', method: 'oauth' })`. The flow owns the credential — this half never writes the store. |
| `lib/client.js` | Watches for the sign-in mount node inside the provider dialog and mounts a plain-DOM card (device code, copy, cancel, "already signed in" state). |

The mount node itself comes from a vendored-runtime patch the launcher applies:
`patches/dsh-client-ui-settings-models@<runtime>.patch` renders

```jsx
{props.provider === "openai-codex" ? <div data-dsh-codex-signin="mount" /> : null}
```

inside `ProviderEditor`. Without that patch the card simply never mounts; the
plugin stays inert.

## Flow

1. Settings → Models → Add provider → provider `openai-codex`.
2. The card appears under the API-key field: **开始登录**.
3. It shows the OpenAI verification URL and a device code (15 minutes).
4. After approval the flow commits the grant; the card shows the account id.
5. **Save** the dialog to write the `providers.openai-codex` route
   (`api: openai-codex-responses`); its models come from the installed catalog.

## Notes

- The device-code path is the only login method this surface offers; the browser
  path needs a callback on `localhost:1455`, which the renderer cannot host.
- Using a ChatGPT plan through a third-party client is a Grey area with respect
  to OpenAI's terms; the capability ships with the upstream dependency
  (`pi-ai`), and this package only surfaces the entry.
