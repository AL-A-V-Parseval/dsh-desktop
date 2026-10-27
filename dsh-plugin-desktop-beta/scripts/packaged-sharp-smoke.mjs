/** Run sharp from one packaged Next archive through the Host's resolver and process an image as an attachment would; Linux must run the WebAssembly build. No window, no input. */
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
if (!root) throw new Error('packaged-sharp-smoke: expected the packaged application root')
const { installSharpWasmResolution, SHARP_WASM_PACKAGE } = await import(pathToFileURL(join(root, 'lib', 'host-resolution.js')).href)
const warnings = []
process.on('warning', (warning) => { warnings.push(warning.code ?? warning.name) })
const withoutHostHook = process.argv.includes('--without-host-hook')
if (!withoutHostHook) installSharpWasmResolution(root)
// The attachment and Market plugins resolve sharp by name from the application tree.
const require = createRequire(join(root, 'package.json'))
const entry = require.resolve('sharp')
if (!entry.replaceAll('\\', '/').endsWith('/sharp/dist/index.cjs') || existsSync(join(dirname(entry), '..', 'bridge'))) {
  throw new Error('packaged-sharp-smoke: retired sharp bridge is still packaged')
}
const sharp = require('sharp')
const wasm = Object.keys(require.cache).some(path => path.replaceAll('\\', '/').includes(`/node_modules/${SHARP_WASM_PACKAGE}/`))
const backend = wasm ? 'WebAssembly' : 'native'
// Electron's Linux executable links the system GLib, which the native Linux backends collide with.
if (wasm !== (process.platform === 'linux')) throw new Error(`packaged-sharp-smoke: sharp ${sharp.versions.sharp} runs its ${backend} backend on ${process.platform}`)
const png = await sharp({ create: { width: 64, height: 48, channels: 4, background: { r: 12, g: 34, b: 56, alpha: 0.5 } } }).png().toBuffer()
// Exercise the actual lazy attachment loader too, not only a direct sharp import.
const attachment = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-attachment-local')).href)
const storage = mkdtempSync(join(tmpdir(), 'dsh-packaged-sharp-attachment-'))
try {
  const hash = createHash('sha256').update(png).digest('hex')
  const objects = join(storage, 'objects', hash.slice(0, 2))
  mkdirSync(objects, { recursive: true })
  writeFileSync(join(objects, hash), png)
  const read = await attachment.readImageFile(storage, {
    attachmentId: `sha256:${hash}`, mediaType: 'image/png', width: 64, height: 48, bytes: png.length, name: 'fixture.png',
  })
  if (!Buffer.from(read.data).equals(png) || (await sharp(read.data).raw().toBuffer()).length !== 64 * 48 * 4) {
    throw new Error('packaged-sharp-smoke: attachment read or full RGBA decode failed')
  }
} finally { rmSync(storage, { recursive: true, force: true }) }
const { data, info } = await sharp(png, { failOn: 'error', limitInputPixels: false }).rotate().toColourspace('srgb')
  .resize({ width: 32, height: 32, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, effort: 0 }).toBuffer({ resolveWithObject: true })
const decoded = await sharp(data, { failOn: 'error' }).metadata()
if (decoded.format !== 'webp' || decoded.width !== info.width || decoded.height !== info.height || decoded.hasAlpha !== true) {
  throw new Error(`packaged-sharp-smoke: the WebP round trip came back as ${String(decoded.format)} ${String(decoded.width)}x${String(decoded.height)}`)
}
// sharp warns when it loads a native backend under Electron on Linux.
if (warnings.includes('SharpElectronLinux')) throw new Error('packaged-sharp-smoke: sharp loaded a native Linux backend under Electron')
console.log(`Packaged sharp ${sharp.versions.sharp} ran its ${backend} backend (${withoutHostHook ? 'without Host hook' : 'Host hook'}): libvips ${sharp.versions.vips}, attachment read/full decode and ${String(info.width)}x${String(info.height)} WebP round trip`)
