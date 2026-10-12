/** Electron Builder's beforePack hook: the platform's omissions join the one application file set. */

interface PackContext {
  electronPlatformName: string
  packager: { config: { files?: unknown } }
}

/**
 * Files one platform never loads. node-pty ships every platform's prebuilds in one package, so
 * the build keeps only the target platform's directories.
 * @param platform - Electron platform being packaged.
 * @returns Negated file globs for that platform.
 */
export function platformFileExclusions(platform: NodeJS.Platform): string[] {
  if (platform === 'darwin') return ['!node_modules/node-pty/prebuilds/{linux,win32}-*/**']
  if (platform === 'win32') return ['!node_modules/node-pty/prebuilds/{darwin,linux}-*/**', '!node_modules/node-pty/prebuilds/win32-arm64/**']
  return ['!node_modules/node-pty/prebuilds/{darwin,win32}-*/**']
}

/**
 * Append the platform's omissions to the application file set.
 * electron-builder normalizes the top-level `files` into one `{ filter }` set, while a
 * platform-level `files` list that holds only negations becomes a second matcher, and a
 * matcher with only negations includes every other file. The omissions therefore have to
 * join the first set. A universal macOS build packs each CPU in turn; each pattern is added once.
 * @param files - `config.files` as electron-builder loaded it.
 * @param platform - Electron platform being packaged.
 * @returns The patterns this call added.
 */
export function applyPlatformFileExclusions(files: unknown, platform: NodeJS.Platform): string[] {
  const set: unknown = Array.isArray(files) ? files[0] : undefined
  if (typeof set !== 'object' || set === null || !Array.isArray((set as { filter?: unknown }).filter)) {
    throw new Error('Next packaging: expected the normalized application file set in config.files')
  }
  const filter = (set as { filter: string[] }).filter
  const added: string[] = []
  for (const pattern of platformFileExclusions(platform)) {
    if (filter.includes(pattern)) continue
    filter.push(pattern)
    added.push(pattern)
  }
  return added
}

export default async function beforePack(context: PackContext): Promise<void> {
  const added = applyPlatformFileExclusions(context.packager.config.files, context.electronPlatformName as NodeJS.Platform)
  if (added.length > 0) console.log(`Next ${context.electronPlatformName} payload omits ${added.join(', ')}`)
  await Promise.resolve()
}
