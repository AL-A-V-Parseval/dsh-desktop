/** Next Office skills and bundled authoring dependencies; ported from upstream Desktop's Host composition. */
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import * as officeSkills from '@deepseek-ai/dsh-skill-office'
import * as workspaceDependencies from '@deepseek-ai/dsh-tool-workspace-dependencies'
import { insideArchive, unpackedPath } from '../asar-archive-policy.ts'

/** Loader identity for the application-owned Office composition. */
export const name = 'desktop-office'

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

/**
 * Enable offline Office authoring and LibreOffice Kit operations in the Next profile.
 * @param ctx - Profile scope; child plugins declare their own service requirements.
 * @param config - Bundled payload source and installation root.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  await ctx.plugin(workspaceDependencies, config)
  // The CLI runs under the bundled standalone Node, which reads no archive; its package closure is unpacked beside the archive.
  const manifest = fileURLToPath(import.meta.resolve('@deepseek-ai/libreoffice-kit/package.json'))
  const packageRoot = dirname(insideArchive(manifest) ? unpackedPath(manifest) : manifest)
  await ctx.plugin(officeSkills, {
    assetRoot: join(dirname(config.source), 'office-skills'),
    node: join(config.source, 'dependencies', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node'),
    cli: join(packageRoot, 'lib', 'cli.js'),
  })
}
