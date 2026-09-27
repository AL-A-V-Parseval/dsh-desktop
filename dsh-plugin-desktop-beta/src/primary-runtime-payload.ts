/**
 * Packaged primary runtime payload lookup.
 *
 * A packaged installation carries the pinned Python, Node.js and pnpm payload used
 * by `load_workspace_dependencies` and the Office skills. Electron Builder copies
 * the prepared tree to `resources/runtime`, so the payload is a sibling of the
 * application directory and is published to the Host as `DSH_BUNDLED_PRIMARY_RUNTIME`.
 *
 * An explicit `DSH_PRIMARY_RUNTIME` always wins, including the empty-string opt-out
 * the bundle patch documents, so a user can redirect or disable the bundled payload.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Environment name carrying the payload bundled with this installation. */
export const BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT = 'DSH_BUNDLED_PRIMARY_RUNTIME'
/** Environment name a user sets to override or disable the bundled payload. */
export const PRIMARY_RUNTIME_OVERRIDE_ENVIRONMENT = 'DSH_PRIMARY_RUNTIME'

/** Host facts needed to locate the payload carried by this installation. */
export interface PrimaryRuntimeCarrier {
  /** Whether Electron loaded this application from a packaged installation. */
  readonly isPackaged: boolean
  /** Electron's `process.resourcesPath`, the directory carrying `app` and `runtime`. */
  readonly resourcesPath: string
}

/** Directory holding the payload below one resources directory. */
const PAYLOAD_RELATIVE_PATH = ['runtime', 'primary-runtime'] as const

/**
 * Resolve the payload directory carried by a packaged installation.
 *
 * An unpackaged launch has no carrier payload: development runs either prepare
 * `dsh-plugin-desktop/runtime` through the packaging script or point
 * `DSH_PRIMARY_RUNTIME` at a payload explicitly.
 *
 * @param carrier - packaged state and resources directory of this installation.
 * @param exists - file existence probe, injectable for focused tests.
 * @returns the absolute payload directory, or undefined when this installation carries none.
 */
export function bundledPrimaryRuntimeDirectory(
  carrier: PrimaryRuntimeCarrier,
  exists: (path: string) => boolean = existsSync,
): string | undefined {
  if (!carrier.isPackaged) return undefined
  const directory = join(carrier.resourcesPath, ...PAYLOAD_RELATIVE_PATH)
  return exists(join(directory, 'runtime.json')) ? directory : undefined
}

/**
 * Publish the bundled payload for the Host that boots after this call.
 *
 * The bundled name is written even when an override is present, because the bundle
 * patch reads `DSH_PRIMARY_RUNTIME ?? DSH_BUNDLED_PRIMARY_RUNTIME`.
 *
 * @param carrier - packaged state and resources directory of this installation.
 * @param environment - environment receiving the bundled default; defaults to `process.env`.
 * @param exists - file existence probe, injectable for focused tests.
 * @returns the published payload directory, or undefined when none was published.
 */
export function publishBundledPrimaryRuntime(
  carrier: PrimaryRuntimeCarrier,
  environment: NodeJS.ProcessEnv = process.env,
  exists: (path: string) => boolean = existsSync,
): string | undefined {
  const directory = bundledPrimaryRuntimeDirectory(carrier, exists)
  if (directory !== undefined) environment[BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT] = directory
  return directory
}
