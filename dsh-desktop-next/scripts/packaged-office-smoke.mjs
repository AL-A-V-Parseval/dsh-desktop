/** Discover the real archived Office engine and render a private DOCX fixture; never read user documents. */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
if (!root) throw new Error('packaged-office-smoke: expected the packaged application root')
const { installOfficeEngineResolution } = await import(pathToFileURL(join(root, 'lib/host-resolution.js')).href)
installOfficeEngineResolution(root)
const require = createRequire(join(root, 'package.json'))
const { zipSync, strToU8 } = require('fflate')
const { discoverRuntime, createConverter } = await import(pathToFileURL(require.resolve('@deepseek-ai/libreoffice-kit')).href)
const runtime = await discoverRuntime()
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
  converter = await createConverter({ timeoutMs: 120_000 })
  const result = await converter.render({ inputPath: input, outputPath: output })
  assert.equal(result.backend, 'wasm')
  assert.equal(result.pageCount, 1)
  const pdf = readFileSync(output)
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
  console.log(`Packaged Office ${runtime.version}: WASM discovery and DOCX-to-PDF rendering passed (${result.pageCount} page, ${pdf.length} bytes)`)
} finally {
  try { if (converter) await converter.dispose() }
  finally { rmSync(home, { recursive: true, force: true }) }
}
