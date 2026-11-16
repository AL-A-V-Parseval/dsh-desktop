/** The bundled Office payload the Web profile's Office rows use: where it lives and where the Host installs it. */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { insideArchive } from '../asar-archive-policy.ts'

/** Application-selected bundled payload and installation directories. */
export interface Config {
  /** Bundled payload directory; the sibling `office-skills` directory holds the skill resources. Missing resources fail Host startup. */
  readonly source: string
  /** Directory under the Next home receiving the installed payload. */
  readonly root: string
}

/**
 * Installation name under `<home>/dsh-runtimes`. Next shares `~/.dsh` with the official Desktop, and the
 * tool replaces an installation whose manifest differs, so each edition keeps its own directory.
 */
export const PRIMARY_RUNTIME_INSTALL_NAME = 'dsh-next-primary-runtime'

/**
 * Resolve the Office composition for one Host start.
 * @param runtimeDir - Application directory; the archive itself when packaged.
 * @param source - Bundled payload directory the shell selected for this CPU.
 * @param home - Next home receiving the installation.
 * @param environment - Host environment; DSH_PRIMARY_RUNTIME redirects the single composition, or disables it when empty.
 * @returns The configuration, or undefined when disabled or a development payload was not prepared.
 * @throws For a packaged Host started without a payload path.
 */
export function resolveOfficeConfig(runtimeDir: string, source: string | undefined, home: string, environment: NodeJS.ProcessEnv = process.env): Config | undefined {
  const override = environment.DSH_PRIMARY_RUNTIME
  if (override === '') return undefined
  if (override !== undefined) {
    source = resolve(override)
    if (!existsSync(join(source, 'runtime.json'))) throw new Error(`DSH_PRIMARY_RUNTIME has no runtime.json: ${source}`)
  }
  const packaged = insideArchive(runtimeDir)
  if (source === undefined) {
    if (packaged) throw new Error('Next Host requires the bundled primary runtime path')
    return undefined
  }
  if (!packaged && !existsSync(join(source, 'runtime.json'))) return undefined
  return { source, root: join(home, 'dsh-runtimes', PRIMARY_RUNTIME_INSTALL_NAME) }
}
