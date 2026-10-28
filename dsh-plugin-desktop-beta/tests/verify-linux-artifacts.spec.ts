import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { verifyLinuxArtifacts } from '../scripts/verify-linux-artifacts.ts'

it('verifies current metadata-named artifacts and the architecture-scoped payload', () => {
  const root = mkdtempSync(join(tmpdir(), 'desktop-linux-verifier-'))
  try {
    const metadata = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    writeFileSync(join(root, 'package.json'), JSON.stringify(metadata))
    const dist = join(root, 'dist')
    const unpacked = join(dist, 'linux-unpacked')
    mkdirSync(unpacked, { recursive: true })
    const elf = Buffer.alloc(128)
    elf.write('\x7fELF', 0, 'binary')
    elf.write('AI\x02', 8, 'binary')
    const artifact = (arch: string, ext: string) => join(dist, metadata.build.linux.artifactName.replaceAll('${version}', metadata.version).replaceAll('${arch}', arch).replaceAll('${ext}', ext))
    writeFileSync(artifact('x86_64', 'AppImage'), elf, { mode: 0o755 })
    const deb = Buffer.alloc(128)
    deb.write('!<arch>\ndebian-binary/  ', 0, 'ascii')
    writeFileSync(artifact('amd64', 'deb'), deb)
    writeFileSync(join(unpacked, metadata.build.linux.executableName), elf, { mode: 0o755 })
    const payload = join(unpacked, 'resources', 'runtime', 'x64')
    for (const [relative, data, mode] of [
      ['primary-runtime/runtime.json', JSON.stringify({ platform: 'linux', arch: 'x64' }), 0o600],
      ['primary-runtime/dependencies/python/bin/python3', 'python', 0o755],
      ['primary-runtime/dependencies/node/bin/node', 'node', 0o755],
      ['primary-runtime/dependencies/pnpm/bin/pnpm.mjs', 'pnpm', 0o600],
      ...['office', 'office-docx', 'office-pptx', 'office-xlsx', 'office-render', 'office-recalculate', 'office-export-pdf']
        .map(skill => [`office-skills/${skill}/SKILL.md`, '# skill', 0o600]),
    ] as [string, string, number][]) {
      const segments = relative.split('/')
      mkdirSync(join(payload, ...segments.slice(0, -1)), { recursive: true })
      writeFileSync(join(payload, relative), data, { mode })
    }
    expect(verifyLinuxArtifacts({ desktopRoot: root, version: metadata.version }).appImagePath).toBe(artifact('x86_64', 'AppImage'))
    expect(() => verifyLinuxArtifacts({ desktopRoot: root, version: 'wrong' })).toThrow('ENOENT')
    rmSync(join(payload, 'primary-runtime', 'dependencies', 'node', 'bin', 'node'))
    expect(() => verifyLinuxArtifacts({ desktopRoot: root, version: metadata.version })).toThrow('Node.js executable is missing')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
