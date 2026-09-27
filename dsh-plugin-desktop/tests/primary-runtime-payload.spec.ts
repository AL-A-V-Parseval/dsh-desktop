import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT,
  PRIMARY_RUNTIME_OVERRIDE_ENVIRONMENT,
  bundledPrimaryRuntimeDirectory,
  publishBundledPrimaryRuntime,
} from '../src/primary-runtime-payload.ts'

const RESOURCES_PATH = join('/opt', 'DSH Desktop', 'resources')
const PAYLOAD_PATH = join(RESOURCES_PATH, 'runtime', 'primary-runtime')

/** Existence probe matching the carrier layout without touching the filesystem. */
function exists(path: string): boolean {
  return path === join(PAYLOAD_PATH, 'runtime.json')
}

describe('bundled primary runtime payload', () => {
  it('carries no payload for an unpackaged launch', () => {
    expect(bundledPrimaryRuntimeDirectory({ isPackaged: false, resourcesPath: RESOURCES_PATH }, exists))
      .toBeUndefined()
  })

  it('requires the payload manifest beside the application', () => {
    expect(bundledPrimaryRuntimeDirectory({ isPackaged: true, resourcesPath: RESOURCES_PATH }, () => false))
      .toBeUndefined()
    expect(bundledPrimaryRuntimeDirectory({ isPackaged: true, resourcesPath: RESOURCES_PATH }, exists))
      .toBe(PAYLOAD_PATH)
  })

  it('publishes the bundled directory for the Host environment', () => {
    const environment: NodeJS.ProcessEnv = {}

    expect(publishBundledPrimaryRuntime({ isPackaged: true, resourcesPath: RESOURCES_PATH }, environment, exists))
      .toBe(PAYLOAD_PATH)
    expect(environment[BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT]).toBe(PAYLOAD_PATH)
  })

  it('keeps an explicit user override untouched', () => {
    const environment: NodeJS.ProcessEnv = { [PRIMARY_RUNTIME_OVERRIDE_ENVIRONMENT]: '/tmp/custom-runtime' }

    publishBundledPrimaryRuntime({ isPackaged: true, resourcesPath: RESOURCES_PATH }, environment, exists)

    expect(environment[PRIMARY_RUNTIME_OVERRIDE_ENVIRONMENT]).toBe('/tmp/custom-runtime')
    expect(environment[BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT]).toBe(PAYLOAD_PATH)
  })

  it('leaves the environment alone when the payload is absent', () => {
    const environment: NodeJS.ProcessEnv = {}

    expect(publishBundledPrimaryRuntime({ isPackaged: true, resourcesPath: RESOURCES_PATH }, environment, () => false))
      .toBeUndefined()
    expect(environment[BUNDLED_PRIMARY_RUNTIME_ENVIRONMENT]).toBeUndefined()
  })
})
