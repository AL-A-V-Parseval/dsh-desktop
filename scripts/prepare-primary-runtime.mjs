#!/usr/bin/env node
/**
 * Materialize the pinned Python, Node.js and pnpm payload that the Desktop ships
 * for Office documents and for the `load_workspace_dependencies` tool.
 *
 * The archives, wheels, interpreter versions and Office distribution versions are
 * locked by the pinned upstream checkout (`deepseek-harness/scripts/primary-runtime/
 * lock.json`), so a Desktop release reproduces the same payload the official
 * Harness desktop ships. Preparation never installs into the build host: archives
 * are hash-verified into a local cache, unpacked into a staging directory and only
 * then published to the output directory.
 *
 * Layout written below `--output` (usually `dsh-plugin-desktop/runtime`, copied to
 * `resources/runtime` by Electron Builder):
 *
 *   primary-runtime/runtime.json          payload manifest read by the runtime
 *   primary-runtime/dependencies/node/**  bundled Node.js executable and license
 *   primary-runtime/dependencies/pnpm/**  bundled pnpm used by the returned Node
 *   primary-runtime/dependencies/python/** bundled interpreter and site-packages
 *   office-skills/**                      Office skill assets loaded by default
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import AdmZip from 'adm-zip'
import { x as extractTar } from 'tar'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lockPath = join(repositoryRoot, 'deepseek-harness', 'scripts', 'primary-runtime', 'lock.json')
const smokeScript = join(repositoryRoot, 'deepseek-harness', 'scripts', 'primary-runtime', 'smoke.py')
const DEFAULT_CACHE = join(repositoryRoot, '.cache', 'primary-runtime')
const DEFAULT_DESKTOP = 'dsh-plugin-desktop'
const PAYLOAD_FORMAT = 4
const DOWNLOAD_TIMEOUT_MS = 15 * 60 * 1000
const DOWNLOAD_ATTEMPTS = 4
const PROXY_VARIABLES = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']
const PLATFORM_NAMES = { darwin: 'darwin', linux: 'linux', win32: 'win32' }

function fail(message) {
  throw new Error(`prepare-primary-runtime: ${message}`)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Return whether this environment routes outbound traffic through a proxy. */
export function proxyConfigured(environment = process.env) {
  return PROXY_VARIABLES.some(name => (environment[name] ?? '') !== '')
}

/**
 * Node's built-in fetch only honors an ambient proxy when `NODE_USE_ENV_PROXY` was
 * present before the process started, so re-execute this script once when the
 * environment configures a proxy. Archive hosts such as GitHub Releases are only
 * reachable through that proxy in such setups.
 * @param {readonly string[]} argv - arguments forwarded to the re-executed child.
 */
function ensureProxySupport(argv) {
  if (!proxyConfigured() || process.env.NODE_USE_ENV_PROXY === '1') return undefined
  const major = Number(process.versions.node.split('.')[0])
  if (major < 24) {
    fail('this Node release cannot route fetch through the configured proxy; use Node 24+ or unset the proxy variables')
  }
  const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv], {
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
    stdio: 'inherit',
  })
  if (result.error !== undefined) throw result.error
  return result.status ?? 1
}

/** Map one `platform-arch` target name to its Node platform and architecture. */
export function targetPlatform(target) {
  const [platform, arch] = target.split('-')
  if (!['darwin', 'linux', 'win'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
    fail(`unsupported target ${JSON.stringify(target)}`)
  }
  return { platform: platform === 'win' ? 'win32' : platform, arch }
}

/** Resolve the build-host target name, matching the upstream lock vocabulary. */
export function hostTarget(platform = process.platform, arch = process.arch) {
  const name = platform === 'win32' ? 'win' : platform
  return `${name}-${arch}`
}

function sha256Of(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * Download or reuse one locked archive, verifying its bytes against the lock.
 *
 * The archive hosts are large and, behind a proxy, slow: every attempt carries an
 * explicit abort timer (which also keeps the event loop alive while the response
 * is pending) and a bounded retry budget instead of trusting one long request.
 *
 * @param {string} url - Locked archive URL.
 * @param {string} sha256 - Expected SHA-256 digest.
 * @param {string} cache - Hash-addressed download cache directory.
 * @param {(message: string) => void} log - progress sink.
 * @returns {Promise<string>} absolute path of the verified archive.
 */
export async function downloadLockedAsset(url, sha256, cache, log = () => {}) {
  const destination = join(cache, sha256)
  if (existsSync(destination) && sha256Of(readFileSync(destination)) === sha256) return destination
  rmSync(destination, { force: true })
  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? url)
  let lastError
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    const started = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, DOWNLOAD_TIMEOUT_MS)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      const digest = sha256Of(bytes)
      if (digest !== sha256) throw new Error(`checksum mismatch (received ${digest.slice(0, 12)})`)
      writeFileSync(destination, bytes)
      log(`downloaded ${filename} (${formatMegabytes(bytes.byteLength)}) in ${String(Math.round((Date.now() - started) / 1000))}s`)
      return destination
    } catch (error) {
      lastError = error
      log(`download attempt ${String(attempt)}/${String(DOWNLOAD_ATTEMPTS)} failed for ${filename}: ${error.message}`)
      if (attempt < DOWNLOAD_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, 5_000 * attempt))
    } finally {
      clearTimeout(timer)
    }
  }
  fail(`download failed for ${url}: ${lastError?.message ?? 'unknown error'}`)
}

/** Derive the payload identity the runtime uses to decide whether to reinstall. */
export function payloadDigest(target, runtimeLock, pnpmVersion) {
  const { pythonVersion, pythonRelease, nodeVersion, wheels, pythonPackages } = runtimeLock
  return createHash('sha256').update(JSON.stringify({
    format: PAYLOAD_FORMAT,
    target,
    pythonVersion,
    pythonRelease,
    nodeVersion: pnpmVersion === undefined ? undefined : nodeVersion,
    artifact: runtimeLock.targets[target],
    wheels,
    pythonPackages,
    pnpm: pnpmVersion,
  })).digest('hex')
}

/**
 * Unpack one wheel, retaining auxiliary scripts in its distribution data directory.
 *
 * ZIP archives are unpacked with `adm-zip`; `extract-zip`'s yauzl stream pipeline
 * never settles for large wheels on current Node releases.
 *
 * @param {string} archive - Hash-verified wheel archive.
 * @param {string} destination - Absolute site-packages directory.
 */
export async function unpackWheel(archive, destination) {
  const zip = new AdmZip(archive)
  for (const entry of zip.getEntries()) {
    const [directory, scheme] = entry.entryName.split('/')
    if (directory?.endsWith('.data') && scheme !== '' && scheme !== 'scripts') {
      fail(`wheel requires an unsupported installation path: ${entry.entryName}`)
    }
  }
  zip.extractAllTo(destination, true)
}

/** Unpack one locked ZIP archive into a destination directory. */
export function unpackArchive(archive, destination) {
  new AdmZip(archive).extractAllTo(destination, true)
}

/**
 * Copy the Office skill asset tree to ordinary filesystem resources.
 * @param {string} source - The skill package's assets directory.
 * @param {string} destination - External Office skill resource directory.
 */
export async function prepareOfficeSkillAssets(source, destination) {
  rmSync(destination, { recursive: true, force: true })
  await cp(source, destination, { recursive: true, dereference: true })
}

/**
 * Assemble one target's payload and Office assets below the output directory.
 * @param {object} options - preparation inputs.
 * @param {string} options.target - locked target name, for example `linux-x64`.
 * @param {string} options.output - directory receiving `primary-runtime/` and `office-skills/`.
 * @param {string} options.cache - hash-addressed archive cache directory.
 * @param {string} options.version - carrier version recorded in the manifest.
 * @param {string} options.desktopRoot - desktop package supplying pnpm and Office assets.
 * @param {(message: string) => void} [options.log] - progress sink for downloads.
 * @returns {Promise<{payload: string, manifest: object, bytes: number}>}
 */
export async function preparePrimaryRuntime(options) {
  const lock = readJson(lockPath)
  const target = options.target
  if (!Object.hasOwn(lock.targets, target)) {
    fail(`unknown target ${JSON.stringify(target)}; expected one of ${Object.keys(lock.targets).join(', ')}`)
  }
  const artifact = lock.targets[target]
  const { platform, arch } = targetPlatform(target)
  const output = resolve(options.output)
  const cache = resolve(options.cache)
  const log = options.log ?? (() => {})
  mkdirSync(cache, { recursive: true })
  const staging = mkdtempSync(join(tmpdir(), 'dsh-primary-'))
  try {
    const payload = join(staging, 'payload')
    const dependencies = join(payload, 'dependencies')
    mkdirSync(dependencies, { recursive: true })

    const require = createRequire(join(resolve(options.desktopRoot), 'package.json'))
    const nodeFilename = `node-v${lock.nodeVersion}-${artifact.nodeArchive}`
    const nodeArchive = await downloadLockedAsset(
      `https://nodejs.org/dist/v${lock.nodeVersion}/${nodeFilename}`,
      artifact.nodeSha256,
      cache,
      log,
    )
    const unpackedNode = join(staging, 'node')
    mkdirSync(unpackedNode)
    if (target === 'win-x64') unpackArchive(nodeArchive, unpackedNode)
    else await extractTar({ file: nodeArchive, cwd: unpackedNode })
    const nodeSource = join(unpackedNode, nodeFilename.replace(/\.(?:zip|tar\.gz)$/u, ''))
    mkdirSync(join(dependencies, 'node', 'bin'), { recursive: true })
    mkdirSync(join(dependencies, 'node', 'node_modules'))
    writeFileSync(
      join(dependencies, 'node', 'node_modules', 'README.txt'),
      'Reserved for bundled Node packages. pnpm uses its default installation directories.\n',
    )
    cpSync(
      join(nodeSource, ...(target === 'win-x64' ? ['node.exe'] : ['bin', 'node'])),
      join(dependencies, 'node', 'bin', target === 'win-x64' ? 'node.exe' : 'node'),
    )
    cpSync(join(nodeSource, 'LICENSE'), join(dependencies, 'node', 'LICENSE'))

    // pnpm's manifest is not an exported subpath, so resolve its entry and walk up
    // to the owning package directory before copying the whole package.
    const pnpmEntry = require.resolve('pnpm')
    let pnpmDirectory = dirname(pnpmEntry)
    while (!existsSync(join(pnpmDirectory, 'package.json'))) {
      const parent = dirname(pnpmDirectory)
      if (parent === pnpmDirectory) fail(`pnpm package directory cannot be located from ${pnpmEntry}`)
      pnpmDirectory = parent
    }
    const pnpmVersion = readJson(join(pnpmDirectory, 'package.json')).version
    if (semverMatch(pnpmVersion) === undefined) fail(`bundled pnpm version is not semver: ${pnpmVersion}`)
    await cp(pnpmDirectory, join(dependencies, 'pnpm'), { recursive: true, dereference: true })

    const pythonFilename = `cpython-${lock.pythonVersion}+${lock.pythonRelease}-${artifact.pythonTarget}-install_only_stripped.tar.gz`
    const pythonArchive = await downloadLockedAsset(
      `https://github.com/astral-sh/python-build-standalone/releases/download/${lock.pythonRelease}/${encodeURIComponent(pythonFilename)}`,
      artifact.pythonSha256,
      cache,
      log,
    )
    await extractTar({ file: pythonArchive, cwd: dependencies })

    const manifest = {
      desktopVersion: options.version,
      platform,
      arch,
      payloadDigest: payloadDigest(target, lock, pnpmVersion),
      python: lock.pythonVersion,
      node: lock.nodeVersion,
      pnpm: pnpmVersion,
      pythonPackages: lock.pythonPackages,
    }
    const sitePackages = join(
      dependencies,
      'python',
      ...(platform === 'win32' ? ['Lib'] : ['lib', `python${lock.pythonVersion.split('.').slice(0, 2).join('.')}`]),
      'site-packages',
    )
    mkdirSync(sitePackages, { recursive: true })
    for (const wheel of [...artifact.wheels, ...lock.wheels]) {
      await unpackWheel(await downloadLockedAsset(wheel.url, wheel.sha256, cache, log), sitePackages)
    }
    writeFileSync(join(payload, 'runtime.json'), `${JSON.stringify(manifest, undefined, 2)}\n`)

    const destination = join(output, 'primary-runtime')
    rmSync(destination, { recursive: true, force: true })
    await cp(payload, destination, { recursive: true, dereference: true })
    const officeAssets = join(dirname(require.resolve('@deepseek-ai/dsh-skill-office/package.json')), 'assets')
    if (!existsSync(officeAssets)) fail('the bundled Office skill package has no assets directory')
    await prepareOfficeSkillAssets(officeAssets, join(output, 'office-skills'))
    return { payload: destination, manifest, bytes: directoryBytes(destination) }
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

/** Accept a plain semver value, matching the client-side manifest reader. */
export function semverMatch(value) {
  return /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/u.exec(value)?.[0]
}

/** Sum the on-disk bytes below one directory. */
export function directoryBytes(root) {
  let bytes = 0
  const pending = [root]
  for (let directory = pending.pop(); directory !== undefined; directory = pending.pop()) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) pending.push(path)
      else if (entry.isFile()) bytes += statSync(path).size
    }
  }
  return bytes
}

/** Required payload entries, mirroring the runtime's own validation. */
export function payloadEntries(root, manifest) {
  const dependencies = join(root, 'dependencies')
  const windows = manifest.platform === 'win32'
  const pythonPackages = join(dependencies, 'python',
    ...(windows ? ['Lib'] : ['lib', `python${manifest.python.split('.').slice(0, 2).join('.')}`]), 'site-packages')
  return {
    python: join(dependencies, 'python', ...(windows ? ['python.exe'] : ['bin', 'python3'])),
    node: join(dependencies, 'node', 'bin', windows ? 'node.exe' : 'node'),
    pnpm: join(dependencies, 'pnpm', 'bin', 'pnpm.mjs'),
    pythonPackages,
    nodePackages: join(dependencies, 'node', 'node_modules'),
  }
}

/** Verify an already prepared payload without touching the network. */
export function verifyPrimaryRuntime(output, target, version) {
  const root = join(resolve(output), 'primary-runtime')
  const manifestPath = join(root, 'runtime.json')
  if (!existsSync(manifestPath)) fail(`no prepared payload at ${root}; run the preparation step first`)
  const manifest = readJson(manifestPath)
  const expected = targetPlatform(target)
  if (manifest.platform !== expected.platform || manifest.arch !== expected.arch) {
    fail(`payload at ${root} targets ${manifest.platform}-${manifest.arch}, expected ${target}`)
  }
  if (version !== undefined && manifest.desktopVersion !== version) {
    fail(`payload at ${root} records desktopVersion ${manifest.desktopVersion}, expected ${version}`)
  }
  for (const [label, path] of Object.entries(payloadEntries(root, manifest))) {
    const entry = statSync(path, { throwIfNoEntry: false })
    if (entry === undefined) fail(`payload is missing its ${label} entry at ${path}`)
  }
  for (const [label, path] of [['Python', payloadEntries(root, manifest).python], ['Node.js', payloadEntries(root, manifest).node]]) {
    if ((statSync(path).mode & 0o111) === 0) fail(`bundled ${label} is not executable: ${path}`)
  }
  const officeRoot = join(resolve(output), 'office-skills')
  if (!existsSync(join(officeRoot, 'scripts', 'check_office.py'))) {
    fail(`Office skill assets are missing from ${officeRoot}`)
  }
  return { root, officeRoot, manifest, bytes: directoryBytes(root) + directoryBytes(officeRoot) }
}

/** Execute the payload's interpreters, package manager and Office round trips. */
export function smokePrimaryRuntime(root, manifest, officeRoot) {
  const entries = payloadEntries(root, manifest)
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/(?:KEY|SECRET|TOKEN|PASSWORD)/iu.test(name)),
  )
  const options = { stdio: 'inherit', timeout: 300_000, env: environment, cwd: root }
  execFileSync(entries.python, ['-I', '-B', '-c',
    'import decimal, xml.parsers.expat, lzma, uuid, numpy, pandas;'
    + ' assert numpy.arange(4).sum() == 6; assert pandas.DataFrame({"n": [1, 2]}).n.sum() == 3'], options)
  execFileSync(entries.python, ['-I', '-B', smokeScript, JSON.stringify(manifest.pythonPackages),
    manifest.python, join(officeRoot, 'scripts', 'check_office.py')], options)
  execFileSync(entries.python, ['-I', '-B', '-m', 'pip', 'check'], options)
  execFileSync(entries.node, ['-e', `if (process.versions.node !== ${JSON.stringify(manifest.node)}) process.exit(1)`], options)
  execFileSync(entries.node, [entries.pnpm, '--version'], options)
}

function readDesktopVersion(desktopRoot) {
  const manifest = readJson(join(resolve(desktopRoot), 'package.json'))
  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    fail(`desktop package at ${desktopRoot} has no version`)
  }
  return manifest.version
}

function formatMegabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function main() {
  const proxyStatus = ensureProxySupport(process.argv.slice(2))
  if (proxyStatus !== undefined) return proxyStatus
  const { values } = parseArgs({ options: {
    target: { type: 'string' },
    output: { type: 'string' },
    cache: { type: 'string' },
    desktop: { type: 'string', default: DEFAULT_DESKTOP },
    check: { type: 'boolean', default: false },
    'skip-smoke': { type: 'boolean', default: false },
  } })
  const desktopRoot = resolve(repositoryRoot, values.desktop)
  const target = values.target ?? hostTarget()
  const output = resolve(values.output ?? join(desktopRoot, 'runtime'))
  const version = readDesktopVersion(desktopRoot)
  if (values.check) {
    const verified = verifyPrimaryRuntime(output, target, version)
    console.log(`prepare-primary-runtime: verified ${target} payload at ${verified.root} (${formatMegabytes(verified.bytes)})`)
    return
  }
  const cache = values.cache ?? DEFAULT_CACHE
  const log = message => { console.log(`prepare-primary-runtime: ${message}`) }
  const prepared = await preparePrimaryRuntime({ target, output, cache, version, desktopRoot, log })
  const verified = verifyPrimaryRuntime(output, target, version)
  const native = manifestIsNative(verified.manifest)
  if (native && !values['skip-smoke']) {
    // The smoke checks execute the payload, so they only run on a matching host.
    smokePrimaryRuntime(verified.root, verified.manifest, verified.officeRoot)
  }
  console.log(
    `prepare-primary-runtime: ${target} payload at ${output} `
    + `(${formatMegabytes(prepared.bytes)} payload, Office assets ready`
    + `${native ? ', smoke passed' : ', smoke skipped on this host'})`,
  )
  return 0
}

function manifestIsNative(manifest) {
  return manifest.platform === process.platform && manifest.arch === process.arch
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = (await main()) ?? 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
