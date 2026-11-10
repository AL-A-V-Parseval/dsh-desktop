# DeepSeek API configuration removal

Source change for Linux Stable (Next) and Beta; not a new packaged release.

## Behavior

- The configured built-in DeepSeek API row now offers the existing provider-delete
  confirmation. Cancellation leaves its key and settings intact.
- Confirmation removes its actual local API-key reference (normally
  `DEEPSEEK_API_KEY`) and resets only the user section of `llm-deepseek`.
  It does not change DeepSeek account login, other provider settings, conversations
  or attachments. An unused API disappears from the configured list and remains
  available through **Add model provider**.
- Environment, read-only and shared credentials do not get a delete action.
  Unavailable credential metadata leaves the existing row unchanged.
- The upstream confirmation reports write refusals. Its credential and settings
  operations are sequential, not transactional: if resetting settings fails after
  key removal, the error is shown and the user can complete removal manually.

## Implementation and verification

The version-scoped `dsh-client-ui-settings-models@0.2.2-rc.1.patch` projects only
the Models page's built-in API row and reuses the upstream dialog and operations.
The account/onboarding store and upstream source checkout are unchanged.

- Mirrored `tests/deepseek-api-removal.spec.ts` exercises the installed browser
  bundle's row classification, credential target and mutation/error behavior.
- Next and Beta: 137 test files passed each, 1,264 tests passed and 11 skipped each;
  both package typechecks passed.
- A headless Chromium check against the real pinned Host and official frontend,
  using a temporary OS home/Profile and fake keys, verified confirmation,
  cancellation, refusal reporting, disappearance and UI re-add. Host RPC reads
  verified the API user-section reset and preservation of every other settings
  namespace and an unrelated key. No real credentials were used.
- Immutable Yarn installation, desktop mirror, bilingual-document and whitespace
  checks passed. No installed application was replaced or restarted.
