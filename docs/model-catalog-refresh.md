# Desktop model catalog

`pi-model-catalog.json` records the public npm catalog snapshot bundled with Desktop.
The catalog refresh changes only `dist/providers/data/*.json` (including its manifest)
inside `patches/pi-ai@<version>.patch`. Linux Stable (Next) and Beta now both run
DSH `0.2.2-rc.1` with pi-ai `1.4.0`; their catalog receipt is
`pi-model-catalog-1.4.0.json`. `pi-model-catalog.json` and the pi-ai `1.1.0` patch
retain the earlier Next catalog history, not the current runtime selection.
Protocol/OAuth code stays on each runtime's pinned SDK, including its streaming
JSON compatibility fix. Preserve the retained legacy family's separate dependency
graph rather than introducing one global SDK override.

To reproduce the committed refresh, download the base runtime tarball and the
versioned catalog metadata/tarball from npm, then run:

```sh
python3 scripts/refresh-pi-model-catalog.py base.tgz catalog.tgz catalog-metadata.json
corepack yarn install
corepack yarn check
```

The generator verifies npm integrity, provider-file identity, catalog schema,
generated-loader identity, manifest hashes and existing protocol support. A gate
failure requires review rather than silently accepting a newer runtime schema.
Commit the patch, provenance and lockfile together. It does not modify user
provider settings, custom models, credentials, defaults or saved conversations.
Account-specific remote discovery remains separate and may depend on entitlement.

Published npm data may predate a model release. Reviewed mainline backports live in
`pi-model-catalog-additions.json`, with pinned source links and explicit route-specific
changes. The refresh generator applies these additions reproducibly, rebuilds the
manifest hashes, records both snapshot dates, and fails if a published catalog
already contains the addition (so the temporary backport can be reviewed/retired).
An npm version bump alone is not evidence that its embedded model list is current.

Office uses a single Host-owned composition. `DSH_PRIMARY_RUNTIME` redirects that
composition to a directory containing `runtime.json` and the expected interpreter
tree; its sibling `office-skills` directory supplies assets. An empty string
disables Office. The old `DSH_BUNDLED_PRIMARY_RUNTIME` publisher and duplicate
Loader insertions have been retired; the shell selects the architecture-specific
bundled payload by default.
