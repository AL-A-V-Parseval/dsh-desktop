/** Test Office service engine discovery and built-in conversion from the real application archive. */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = process.argv[2]
if (!root) throw new Error('packaged-office-smoke: expected the packaged application root')
const { installOfficeEngineResolution } = await import(pathToFileURL(join(root, 'lib/host-resolution.js')).href)
installOfficeEngineResolution(root)
const require = createRequire(join(root, 'package.json'))
const { zipSync, strToU8 } = require('fflate')
const { OfficeKit } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-office-kit')).href)
const { createConverter, resolveEnginePackage } = await OfficeKit.prototype.importKit()
const { discoverRuntime } = await import(pathToFileURL(require.resolve('@deepseek-ai/libreoffice-kit')).href)
const runtime = await discoverRuntime({ resolveEnginePackage })
assert.equal(runtime.backend, 'wasm', 'Linux packages carry the shared WASM Office engine')
const home = mkdtempSync(join(tmpdir(), 'dsh-packaged-office-'))
let converter
try {
  const input = join(home, 'fixture.docx')
  const output = join(home, 'fixture.pdf')
  writeFileSync(input, zipSync({
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>`),
    'word/document.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body><w:p><w:r><w:t>DSH packaged Office regression check</w:t></w:r></w:p>
          <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
        </w:body>
      </w:document>`),
  }))
  converter = await createConverter({ timeoutMs: 120_000, resolveEnginePackage })
  const result = await converter.render({ inputPath: input, outputPath: output })
  assert.equal(result.backend, 'wasm')
  assert.equal(result.pageCount, 1)
  const pdf = readFileSync(output)
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  const slides = fileURLToPath(new URL('../../deepseek-harness/scripts/fixtures/office-render/color-blocks.pptx', import.meta.url))
  const rendered = await converter.renderImages({ inputPath: slides, outputDir: join(home, 'images'), pages: [1] })
  assert.equal(rendered.images.length, 1)
  assert.equal(readFileSync(rendered.images[0].path).subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  console.log(`Packaged Office ${runtime.version}: WASM discovery, DOCX-to-PDF and PPTX-to-PNG passed`)
} finally {
  try { if (converter) await converter.dispose() }
  finally { rmSync(home, { recursive: true, force: true }) }
}
