/** Verify the unsigned Linux x64 AppImage and deb artifacts plus the unpacked executable. */

import { closeSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ELF_HEADER_BYTES = 4
const APPIMAGE_MAGIC_OFFSET = 8
const APPIMAGE_MAGIC_BYTES = 3
const DEB_MEMBER_HEADER_BYTES = 60

/** Paths returned after Linux artifact verification succeeds. */
export interface LinuxArtifacts {
  /** AppImage distribution path. */
  readonly appImagePath: string
  /** Debian package path. */
  readonly debPath: string
  /** Unpacked application executable path. */
  readonly applicationPath: string
  /** Unpacked bundled primary runtime payload root beside the application. */
  readonly payloadPath: string
}

/** Injectable Linux artifact verification boundary. */
export interface LinuxArtifactVerificationOptions {
  /** Desktop package root containing package.json and dist. */
  readonly desktopRoot: string
  /** Product version embedded in the expected artifact names. */
  readonly version: string
}

function readVersion(desktopRoot: string): string {
  const manifest = JSON.parse(readFileSync(join(desktopRoot, 'package.json'), 'utf8')) as {
    version?: unknown
  }
  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    throw new Error(`desktop package at ${desktopRoot} has no valid version`)
  }
  return manifest.version
}

/**
 * Verify that a generated file is a non-empty regular ELF executable.
 * @param path - Artifact path to probe.
 * @param label - Human-readable role used in failure messages.
 */
export function assertElfExecutable(path: string, label: string): void {
  const stat = statSync(path)
  if (!stat.isFile() || stat.size < ELF_HEADER_BYTES + APPIMAGE_MAGIC_OFFSET) {
    throw new Error(`${label} is not a non-empty regular file: ${path}`)
  }
  if ((stat.mode & 0o111) === 0) {
    throw new Error(`${label} is not executable: ${path}`)
  }
  const descriptor = openSync(path, 'r')
  const header = Buffer.alloc(ELF_HEADER_BYTES)
  try {
    const bytesRead = readSync(descriptor, header, 0, header.byteLength, 0)
    if (
      bytesRead !== header.byteLength
      || header[0] !== 0x7f
      || header.subarray(1, ELF_HEADER_BYTES).toString('ascii') !== 'ELF'
    ) {
      throw new Error(`${label} does not have an ELF header: ${path}`)
    }
  } finally {
    closeSync(descriptor)
  }
}

/**
 * Verify that a generated file is an AppImage: an ELF executable carrying the
 * AppImage type magic at offset 8.
 * @param path - Artifact path to probe.
 * @param label - Human-readable role used in failure messages.
 */
export function assertAppImage(path: string, label: string): void {
  assertElfExecutable(path, label)
  const descriptor = openSync(path, 'r')
  const magic = Buffer.alloc(APPIMAGE_MAGIC_BYTES)
  try {
    const bytesRead = readSync(descriptor, magic, 0, magic.byteLength, APPIMAGE_MAGIC_OFFSET)
    if (bytesRead !== magic.byteLength || !magic.equals(Buffer.from([0x41, 0x49, 0x02]))) {
      throw new Error(`${label} does not have an AppImage magic: ${path}`)
    }
  } finally {
    closeSync(descriptor)
  }
}

/**
 * Verify that a generated file is a Debian binary package: an ar archive whose
 * first member is the mandatory debian-binary version marker.
 * @param path - Artifact path to probe.
 * @param label - Human-readable role used in failure messages.
 */
export function assertDebArchive(path: string, label: string): void {
  const stat = statSync(path)
  if (!stat.isFile() || stat.size < `!<arch>\n`.length + DEB_MEMBER_HEADER_BYTES) {
    throw new Error(`${label} is not a non-empty regular file: ${path}`)
  }
  const descriptor = openSync(path, 'r')
  const header = Buffer.alloc(`!<arch>\n`.length + DEB_MEMBER_HEADER_BYTES)
  try {
    const bytesRead = readSync(descriptor, header, 0, header.byteLength, 0)
    if (bytesRead !== header.byteLength || header.subarray(0, `!<arch>\n`.length).toString('ascii') !== '!<arch>\n') {
      throw new Error(`${label} does not have an ar archive header: ${path}`)
    }
    // The ar member name field is space-padded; debian-binary must come first.
    const memberName = header.subarray(`!<arch>\n`.length, `!<arch>\n`.length + 16).toString('ascii')
    if (!memberName.startsWith('debian-binary')) {
      throw new Error(`${label} does not lead with a debian-binary member: ${path}`)
    }
  } finally {
    closeSync(descriptor)
  }
}

/** Payload entries required inside one packaged Linux installation, below its arch directory. */
const requiredPayloadEntries = (arch: string) => [
  ['Python interpreter', [arch, 'primary-runtime', 'dependencies', 'python', 'bin', 'python3'], true],
  ['Node.js executable', [arch, 'primary-runtime', 'dependencies', 'node', 'bin', 'node'], true],
  ['pnpm entry', [arch, 'primary-runtime', 'dependencies', 'pnpm', 'bin', 'pnpm.mjs'], false],
  ...['office', 'office-docx', 'office-pptx', 'office-xlsx', 'office-render', 'office-recalculate', 'office-export-pdf']
    .map(skill => [`Office ${skill} skill`, [arch, 'office-skills', skill, 'SKILL.md'], false] as const),
] as const

/**
 * Verify the bundled primary runtime payload copied beside the application.
 *
 * Packaging prepares the payload from the lock pinned by the upstream checkout and
 * Electron Builder publishes it through the Linux target's `extraResources`. The
 * shell resolves it at `<resources>/runtime/<arch>/primary-runtime`, so the payload
 * is arch-scoped; this fork's Linux builds ship one architecture, and the directory
 * it published is the one verified here.
 *
 * @param payloadRoot - `resources/runtime` of the unpacked application.
 */
export function assertPrimaryRuntimePayload(payloadRoot: string): void {
  let architectures: string[] = []
  try {
    architectures = readdirSync(payloadRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && (entry.name === 'x64' || entry.name === 'arm64'))
      .map(entry => entry.name)
  } catch {
    // A missing or unreadable payload root is reported below with its own message.
  }
  if (architectures.length === 0) {
    throw new Error(`bundled primary runtime manifest is unreadable: no prepared payload under ${payloadRoot}`)
  }
  const arch = architectures.length === 1 ? architectures[0] : undefined
  if (arch === undefined) {
    throw new Error(`bundled primary runtime carries ${String(architectures.length)} architecture directories under ${payloadRoot}, expected one`)
  }
  const manifestPath = join(payloadRoot, arch, 'primary-runtime', 'runtime.json')
  let manifest: { platform?: unknown, arch?: unknown, python?: unknown }
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as typeof manifest
  } catch (cause) {
    throw new Error(`bundled primary runtime manifest is unreadable: ${manifestPath}`, { cause })
  }
  if (manifest.platform !== 'linux' || manifest.arch !== arch) {
    throw new Error(`bundled primary runtime targets ${String(manifest.platform)}-${String(manifest.arch)}, expected linux-${arch}`)
  }
  for (const [label, segments, executable] of requiredPayloadEntries(arch)) {
    const path = join(payloadRoot, ...segments)
    const entry = statSync(path, { throwIfNoEntry: false })
    if (entry === undefined || !entry.isFile()) {
      throw new Error(`${label} is missing from the bundled primary runtime: ${path}`)
    }
    if (executable && (entry.mode & 0o111) === 0) {
      throw new Error(`${label} is not executable: ${path}`)
    }
  }
}

function defaultOptions(): LinuxArtifactVerificationOptions {
  const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  return {
    desktopRoot,
    version: readVersion(desktopRoot),
  }
}

/**
 * Verify the exact AppImage, Debian package, and unpacked application executable.
 * @param options - Artifact root and expected product version.
 * @returns The verified artifact paths.
 */
export function verifyLinuxArtifacts(
  options: LinuxArtifactVerificationOptions = defaultOptions(),
): LinuxArtifacts {
  const distDir = join(options.desktopRoot, 'dist')
  const appImagePath = join(distDir, `DSH-Desktop-${options.version}-x86_64.AppImage`)
  const debPath = join(distDir, `DSH-Desktop-${options.version}-amd64.deb`)
  const applicationPath = join(distDir, 'linux-unpacked', 'dsh-desktop')
  const payloadPath = join(distDir, 'linux-unpacked', 'resources', 'runtime')

  assertAppImage(appImagePath, 'Linux AppImage')
  assertDebArchive(debPath, 'Linux Debian package')
  assertElfExecutable(applicationPath, 'unpacked Linux application')
  assertPrimaryRuntimePayload(payloadPath)
  return { appImagePath, debPath, applicationPath, payloadPath }
}

const invokedPath = process.argv[1]
if (invokedPath !== undefined && resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  try {
    const verified = verifyLinuxArtifacts()
    console.log(
      `Linux artifact verification passed: ${verified.appImagePath}, ${verified.debPath}, `
      + `bundled primary runtime at ${verified.payloadPath}`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
