/** Relocatable, integrity-recorded production payload carried by one Next release. */

import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFile, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { promisify } from 'node:util'

/** Descriptor at the root of the immutable Next application payload. */
export const DESKTOP_RUNTIME_FILE = 'desktop-runtime.json'

/** Release facts shared by one Electron shell and the dsh runtime it carries. */
export interface NextRelease {
  readonly schemaVersion: 1
  /** Exact Next product version Electron reports. */
  readonly version: string
  /** Exact `@deepseek-ai/dsh` version the payload carries. */
  readonly dshVersion: string
  /** Electron release whose Node mode runs the Host and every package operation. */
  readonly electronVersion: string
  /** Bundled pnpm version used for Profile package operations. */
  readonly pnpmVersion: string
}

/** Platform and CPU architectures whose native dependencies the payload includes. */
export interface NextRuntimeTarget {
  readonly platform: NodeJS.Platform
  readonly archs: readonly string[]
}

/** Release-owned package that Profiles resolve through the Next installation anchor. */
export interface DesktopSharedPackage {
  readonly name: string
  readonly version: string
  readonly path: string
}

/** Final bytes, executable permission and Mach-O identity of one payload file. */
export interface DesktopRuntimeFile {
  readonly path: string
  readonly bytes: number
  readonly sha256: string
  readonly executable: boolean
  /** Mach-O image; macOS code signing rewrites these after the descriptor is sealed. */
  readonly machO: boolean
}

/** One packaged application's production payload. */
export interface DesktopRuntimeDescriptor {
  readonly schemaVersion: 1
  readonly release: NextRelease
  readonly platform: NodeJS.Platform
  readonly archs: readonly string[]
  readonly sharedPackages: readonly DesktopSharedPackage[]
  readonly files: readonly DesktopRuntimeFile[]
}

/** Facts the running application compares with its sealed descriptor. */
export interface PackagedRuntimeIdentity {
  readonly version: string
  readonly dshVersion: string
  readonly platform: NodeJS.Platform
  readonly arch: string
}

/** Verification options after Electron Builder signed the payload in place. */
export interface VerifyDesktopRuntimeOptions {
  /**
   * Accept code-signing rewrites: Mach-O files and `_CodeSignature` contents may differ from the
   * sealed bytes, and new files may exist. Every recorded file must still exist with its permission.
   */
  readonly afterCodeSigning?: boolean
}

const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/[a-z0-9][a-z0-9._~-]*|[a-z0-9][a-z0-9._~-]*)$/u
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u
/** Thin and fat Mach-O magic numbers in both byte orders. */
const MACH_O_MAGIC = new Set([0xFEEDFACE, 0xFEEDFACF, 0xCEFAEDFE, 0xCFFAEDFE, 0xCAFEBABE, 0xBEBAFECA])
const readRuntimeFile = promisify(readFile)

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Resolve one portable resource path without permitting traversal or absolute paths.
 * @param root - Runtime root.
 * @param path - Slash-separated relative path from durable metadata.
 * @returns Absolute resource path.
 */
export function runtimePath(root: string, path: string): string {
  if (path === '' || isAbsolute(path) || path.includes('\\') || path.includes(':')
    || path.split('/').some(part => part === '' || part === '.' || part === '..')) {
    throw new Error(`desktop runtime: invalid relative path ${JSON.stringify(path)}`)
  }
  return join(root, ...path.split('/'))
}

function runtimeFiles(root: string): { path: string; name: string }[] {
  const files: { path: string; name: string }[] = []
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      const name = relative(root, path).split(sep).join('/')
      if (name === DESKTOP_RUNTIME_FILE) continue
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) files.push({ path, name })
      else throw new Error(`desktop runtime: unsupported filesystem entry ${name}`)
    }
  }
  visit(root)
  return files
}

function isMachO(body: Buffer): boolean {
  return body.byteLength >= 4 && MACH_O_MAGIC.has(body.readUInt32BE(0))
}

function runtimeFile(path: string, name: string, body: Buffer): DesktopRuntimeFile {
  return { path: name, bytes: body.byteLength, sha256: createHash('sha256').update(body).digest('hex'),
    // Windows has no portable Unix executable permission bits.
    executable: process.platform !== 'win32' && (lstatSync(path).mode & 0o111) !== 0, machO: isMachO(body) }
}

function byPath(a: DesktopRuntimeFile, b: DesktopRuntimeFile): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}

/**
 * Inventory a materialized payload without following links or including its descriptor.
 * @param root - Self-contained application payload directory.
 * @returns Sorted final-file inventory; executable permissions are false on Windows.
 */
export function inventoryDesktopRuntime(root: string): DesktopRuntimeFile[] {
  return runtimeFiles(root).map(({ path, name }) => runtimeFile(path, name, readFileSync(path))).sort(byPath)
}

async function inventoryRuntimeForVerification(root: string): Promise<DesktopRuntimeFile[]> {
  const entries = runtimeFiles(root)
  const files: DesktopRuntimeFile[] = []
  const remaining = entries.values()
  let failed = false
  const workers = Array.from({ length: Math.min(8, entries.length) }, async () => {
    while (!failed) {
      const next = remaining.next()
      if (next.done) return
      const { path, name } = next.value
      try {
        files.push(runtimeFile(path, name, await readRuntimeFile(path)))
      } catch (error) {
        failed = true
        throw error
      }
    }
  })
  // Failure returns only after every outstanding file read has closed its descriptor.
  const results = await Promise.allSettled(workers)
  for (const result of results) if (result.status === 'rejected') throw result.reason
  return files.sort(byPath)
}

/**
 * Validate release facts read from a packaged or generated descriptor.
 * @param value - Parsed `release` field.
 * @returns The release facts.
 */
export function parseNextRelease(value: unknown): NextRelease {
  if (!record(value) || value.schemaVersion !== 1) throw new Error('desktop runtime: unsupported release schema')
  for (const field of ['version', 'dshVersion', 'electronVersion', 'pnpmVersion'] as const) {
    if (typeof value[field] !== 'string' || !VERSION.test(value[field])) throw new Error(`desktop runtime: invalid release ${field}`)
  }
  return { schemaVersion: 1, version: value.version as string, dshVersion: value.dshVersion as string,
    electronVersion: value.electronVersion as string, pnpmVersion: value.pnpmVersion as string }
}

function parseTarget(platform: unknown, archs: unknown): NextRuntimeTarget {
  if (typeof platform !== 'string' || platform === '' || !Array.isArray(archs) || archs.length === 0
    || archs.some(arch => typeof arch !== 'string' || arch === '')) throw new Error('desktop runtime: invalid target')
  const unique = [...new Set(archs as string[])].sort()
  if (unique.length !== archs.length) throw new Error('desktop runtime: duplicate target architecture')
  return { platform: platform as NodeJS.Platform, archs: unique }
}

/**
 * Seal the final payload after Electron Builder copied and pruned it.
 * @param root - Application payload directory.
 * @param release - Matching shell, dsh, Electron and pnpm versions.
 * @param sharedNames - Release-owned packages supplied to Profiles.
 * @param target - Platform and architectures whose native dependencies the payload includes.
 * @returns Descriptor written beside the production packages.
 */
export function writeDesktopRuntime(
  root: string, release: NextRelease, sharedNames: readonly string[], target: NextRuntimeTarget,
): DesktopRuntimeDescriptor {
  const { platform, archs } = parseTarget(target.platform, target.archs)
  const sharedPackages = [...new Set(sharedNames)].sort().map((name) => {
    if (!PACKAGE_NAME.test(name)) throw new Error(`desktop runtime: invalid shared package ${name}`)
    const path = `node_modules/${name}`
    const manifest: unknown = JSON.parse(readFileSync(join(runtimePath(root, path), 'package.json'), 'utf8'))
    if (!record(manifest) || manifest.name !== name || typeof manifest.version !== 'string' || !VERSION.test(manifest.version)) {
      throw new Error(`desktop runtime: invalid shared package manifest ${name}`)
    }
    return { name, version: manifest.version, path }
  })
  const descriptor: DesktopRuntimeDescriptor = {
    schemaVersion: 1, release: parseNextRelease(release), platform, archs, sharedPackages, files: inventoryDesktopRuntime(root),
  }
  writeFileSync(join(root, DESKTOP_RUNTIME_FILE), `${JSON.stringify(descriptor, undefined, 2)}\n`)
  return descriptor
}

/**
 * Read packaged metadata and check the shared package records.
 * @param root - Application payload directory.
 * @returns Runtime metadata whose file inventory is verified only during packaging.
 */
export function readDesktopRuntime(root: string): DesktopRuntimeDescriptor {
  const value: unknown = JSON.parse(readFileSync(join(root, DESKTOP_RUNTIME_FILE), 'utf8'))
  if (!record(value) || value.schemaVersion !== 1 || !Array.isArray(value.sharedPackages) || !Array.isArray(value.files)) {
    throw new Error('desktop runtime: invalid descriptor')
  }
  const release = parseNextRelease(value.release)
  const { platform, archs } = parseTarget(value.platform, value.archs)
  const sharedPackages = value.sharedPackages.map((entry: unknown): DesktopSharedPackage => {
    if (!record(entry) || typeof entry.name !== 'string' || !PACKAGE_NAME.test(entry.name)
      || typeof entry.version !== 'string' || !VERSION.test(entry.version) || entry.path !== `node_modules/${entry.name}`) {
      throw new Error('desktop runtime: invalid shared package record')
    }
    return { name: entry.name, version: entry.version, path: entry.path }
  })
  if (new Set(sharedPackages.map(entry => entry.name)).size !== sharedPackages.length) {
    throw new Error('desktop runtime: duplicate shared package')
  }
  if (sharedPackages.find(entry => entry.name === '@deepseek-ai/dsh')?.version !== release.dshVersion) {
    throw new Error('desktop runtime: missing or mismatched @deepseek-ai/dsh')
  }
  return { schemaVersion: 1, release, platform, archs, sharedPackages, files: value.files as DesktopRuntimeFile[] }
}

/** Whether a recorded path belongs to a nested code-signature directory that signing rewrites. */
function isCodeSignatureEntry(path: string): boolean {
  return path.split('/').includes('_CodeSignature')
}

/**
 * Verify every payload file against its recorded bytes and permissions at build time.
 * @param root - Application payload directory.
 * @param expectedVersion - Version the payload must declare: the product version, or the
 * `DSH_NEXT_BUILD_VERSION` a drill build was given.
 * @param target - Required platform and architectures.
 * @param options - Code-signing tolerance for a payload that Electron Builder already signed.
 * @returns Validated runtime descriptor.
 */
export async function verifyDesktopRuntime(
  root: string, expectedVersion: string, target: NextRuntimeTarget, options: VerifyDesktopRuntimeOptions = {},
): Promise<DesktopRuntimeDescriptor> {
  const descriptor = readDesktopRuntime(root)
  const expected = parseTarget(target.platform, target.archs)
  if (descriptor.platform !== expected.platform || descriptor.archs.join(',') !== expected.archs.join(',')) {
    throw new Error('desktop runtime: incompatible platform/architecture')
  }
  if (descriptor.release.version !== expectedVersion) {
    throw new Error(`desktop runtime: bundled ${descriptor.release.version} is not the expected ${expectedVersion}`)
  }
  for (const entry of descriptor.sharedPackages) {
    const manifest: unknown = JSON.parse(readFileSync(join(runtimePath(root, entry.path), 'package.json'), 'utf8'))
    if (!record(manifest) || manifest.name !== entry.name || manifest.version !== entry.version) {
      throw new Error(`desktop runtime: shared package metadata mismatch for ${entry.name}`)
    }
  }
  if (options.afterCodeSigning === true) {
    for (const file of descriptor.files) {
      const path = runtimePath(root, file.path)
      const stat = lstatSync(path, { throwIfNoEntry: false })
      if (stat === undefined || !stat.isFile()) throw new Error(`desktop runtime: missing payload file ${file.path}`)
      if (process.platform !== 'win32' && ((stat.mode & 0o111) !== 0) !== file.executable) {
        throw new Error(`desktop runtime: permission changed for ${file.path}`)
      }
      if (file.machO || isCodeSignatureEntry(file.path)) continue
      const actual = runtimeFile(path, file.path, await readRuntimeFile(path))
      if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) throw new Error(`desktop runtime: payload file changed ${file.path}`)
    }
    return descriptor
  }
  const actual = await inventoryRuntimeForVerification(root)
  // Windows has no portable Unix executable permission bits.
  const comparable = (items: readonly DesktopRuntimeFile[]): unknown => process.platform === 'win32'
    ? items.map(({ executable: _executable, ...item }) => item) : items
  if (JSON.stringify(comparable(descriptor.files)) !== JSON.stringify(comparable(actual))) {
    throw new Error('desktop runtime: integrity verification failed')
  }
  return descriptor
}

/**
 * Read the version of one package installed at the payload root.
 * @param root - Application payload or development package directory.
 * @param name - Package name.
 * @returns The installed version.
 */
export function readInstalledPackageVersion(root: string, name: string): string {
  const manifest: unknown = JSON.parse(readFileSync(join(runtimePath(root, `node_modules/${name}`), 'package.json'), 'utf8'))
  if (!record(manifest) || typeof manifest.version !== 'string') throw new Error(`desktop runtime: ${name} has no version`)
  return manifest.version
}

/**
 * Check at startup that the installed payload is the one this application was released with.
 * File bytes are verified only during packaging; here the descriptor must exist, parse, and
 * name the running shell, dsh runtime, platform and architecture.
 * @param root - Packaged application directory.
 * @param identity - Facts of the running application.
 * @returns The sealed descriptor.
 */
export function verifyPackagedRuntimeIdentity(root: string, identity: PackagedRuntimeIdentity): DesktopRuntimeDescriptor {
  const descriptor = readDesktopRuntime(root)
  if (descriptor.release.version !== identity.version) {
    throw new Error(`desktop runtime: payload ${descriptor.release.version} does not belong to DSH NEXT ${identity.version}`)
  }
  if (descriptor.release.dshVersion !== identity.dshVersion) {
    throw new Error(`desktop runtime: payload declares dsh ${descriptor.release.dshVersion} but ${identity.dshVersion} is installed`)
  }
  if (descriptor.platform !== identity.platform || !descriptor.archs.includes(identity.arch)) {
    throw new Error(`desktop runtime: payload for ${descriptor.platform} ${descriptor.archs.join('/')} cannot run on ${identity.platform} ${identity.arch}`)
  }
  return descriptor
}
