import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('the promoted framework owns default Linux workflows without renaming compatibility identifiers', () => {
  const policy = read('../linux-release-policy.json')
  const root = read('../package.json')
  const app = read(`../${policy.workspace}/package.json`)
  assert.equal(policy.channel, 'stable')
  assert.equal(policy.workspace, 'dsh-desktop-next')
  assert.equal(policy.retainNextIdentifiers, true)
  assert.equal(app.name, policy.workspace)
  assert.equal(policy.firstStableTag, 'v2.0.20-next-linux.1')
  assert.equal(policy.legacy.workspace, 'dsh-plugin-desktop')
  assert.equal(policy.legacy.status, 'retired')
  assert.equal(policy.legacy.lastRelease, 'v2.0.18-linux.1')
  for (const command of ['dev', 'start', 'package:dir', 'dist:linux']) {
    assert.ok(root.scripts[command].endsWith(`workspace ${policy.workspace} ${command}`), command)
    assert.ok(!root.scripts[command].includes(`workspace ${policy.legacy.workspace} `), command)
  }
})
