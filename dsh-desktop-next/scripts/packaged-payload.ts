/** Prune, seal and describe the unpacked Next payload after Electron Builder copied it. */
import { readFileSync, readdirSync, rmSync, rmdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { nextRuntimeFileExclusion, type NextPackagingTarget } from './runtime-file-policy.ts'
import { verifyDesktopRuntime, writeDesktopRuntime, type DesktopRuntimeDescriptor, type NextRelease } from '../src/runtime-tree.ts'

/**
 * Architectures whose native dependencies one Next package carries.
 * macOS releases are universal and the Yarn tree installs both Darwin CPU variants, so even a
 * single-architecture directory build ships both; Windows releases are x64 only.
 * @param platform - Electron platform being packaged.
 * @param hostArch - Build host architecture, used for platforms without a release target.
 * @returns Platform and architectures recorded in the payload descriptor.
 */
export function nextPackagingTarget(platform: NodeJS.Platform, hostArch: string = process.arch): NextPackagingTarget {
  if (platform === 'darwin') return { platform, archs: ['arm64', 'x64'] }
  if (platform === 'win32') return { platform, archs: ['x64'] }
  return { platform, archs: [hostArch] }
}

/** Files removed from the copied payload, grouped by the policy reason. */
export interface PrunedPayloadSummary {
  readonly removed: number
  readonly bytes: number
  readonly reasons: Readonly<Record<string, number>>
}

/**
 * Remove the files the Desktop file policy omits from the copied `node_modules` tree, then drop
 * directories left empty. Electron Builder copies the tree before this hook runs, so the policy
 * applies to the payload rather than to the collection globs.
 * @param appRoot - Unpacked application directory (`Resources/app` or `resources/app`).
 * @param target - Platform and architectures of the package.
 * @returns What was removed.
 */
export function pruneNextPayload(appRoot: string, target: NextPackagingTarget): PrunedPayloadSummary {
  const modules = join(appRoot, 'node_modules')
  const reasons: Record<string, number> = {}
  let removed = 0
  let bytes = 0
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        visit(path)
        if (readdirSync(path).length === 0) rmdirSync(path)
        continue
      }
      const reason = nextRuntimeFileExclusion(relative(modules, path).split(sep).join('/'), target)
      if (reason === undefined) continue
      bytes += entry.isFile() ? statSync(path).size : 0
      rmSync(path, { force: true })
      removed += 1
      reasons[reason] = (reasons[reason] ?? 0) + 1
    }
  }
  visit(modules)
  return { removed, bytes, reasons }
}

/**
 * Format a prune summary for packaging logs.
 * @param summary - Result of {@link pruneNextPayload}.
 * @returns One line naming counts per reason.
 */
export function formatPrunedPayload(summary: PrunedPayloadSummary): string {
  const reasons = Object.entries(summary.reasons).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([reason, count]) => `${reason}=${String(count)}`).join(', ')
  return `${String(summary.removed)} files, ${(summary.bytes / 1_048_576).toFixed(1)} MiB${reasons === '' ? '' : ` (${reasons})`}`
}

function manifestVersion(path: string, subject: string): string {
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as { version?: unknown }
  if (typeof manifest.version !== 'string') throw new Error(`Next payload: ${subject} has no version`)
  return manifest.version
}

/**
 * Release facts of one copied payload.
 * @param appRoot - Unpacked application directory.
 * @param electronVersion - Electron release the package embeds.
 * @returns Shell, dsh, Electron and pnpm versions the descriptor records.
 */
export function nextPayloadRelease(appRoot: string, electronVersion: string): NextRelease {
  return {
    schemaVersion: 1,
    // electron-builder merges extraMetadata before copying, so this is the version Electron reports.
    version: manifestVersion(join(appRoot, 'package.json'), 'the packaged manifest'),
    dshVersion: manifestVersion(join(appRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'), '@deepseek-ai/dsh'),
    electronVersion,
    pnpmVersion: manifestVersion(join(appRoot, 'node_modules', 'pnpm', 'package.json'), 'pnpm'),
  }
}

/**
 * Seal the pruned payload and prove the descriptor round-trips before signing.
 * Every direct dependency of the packaged manifest is a shared package: Profiles resolve them
 * through the Next installation anchor.
 * @param appRoot - Unpacked application directory.
 * @param release - Release facts from {@link nextPayloadRelease}.
 * @param target - Platform and architectures of the package.
 * @returns The verified descriptor.
 */
export async function sealNextPayload(appRoot: string, release: NextRelease, target: NextPackagingTarget): Promise<DesktopRuntimeDescriptor> {
  const manifest = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> }
  writeDesktopRuntime(appRoot, release, Object.keys(manifest.dependencies ?? {}), target)
  return verifyDesktopRuntime(appRoot, release.version, target)
}
