import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import {
  DESKTOP_OPEN_WORKSPACE_GLOBAL,
  DESKTOP_PENDING_WORKSPACE_GLOBAL,
} from '../launch-workspace-contract.ts'

/** Page seam the main process evaluates against to deliver a launch folder. */
export interface DesktopLaunchWorkspaceWindow {
  __DSH_DESKTOP_OPEN_WORKSPACE__?: (path: string) => void
  __DSH_DESKTOP_PENDING_WORKSPACE__?: string
}

/** Everything the bridge needs from the client context, kept injectable for tests. */
export interface DesktopLaunchWorkspaceTarget {
  /** Settle once both workspace and session lists have arrived from the Host. */
  ready(): Promise<void>
  /**
   * Register one folder, reusing the existing Workspace when the path is known.
   * @param path - absolute folder admitted by the main process.
   * @returns the registered Workspace.
   */
  create(path: string): Promise<WorkspaceId>
  /** Select one Workspace in the interface. */
  open(workspaceId: WorkspaceId): Promise<void>
  /** Record a failure that the native admission dialogs could not have caught. */
  reportError(message: string): void
}

/**
 * Register and open one launch folder.
 *
 * Waiting on `ready()` is not politeness: a Workspace row inserted before the
 * first Host baseline lands is wholesale-replaced when that baseline installs,
 * and the subsequent open then fails against an id the list no longer holds.
 * @param target - client-context seam.
 * @param path - absolute folder admitted by the main process.
 */
export async function openDesktopLaunchWorkspace(
  target: DesktopLaunchWorkspaceTarget,
  path: string,
): Promise<void> {
  try {
    await target.ready()
    const workspaceId = await target.create(path)
    await target.open(workspaceId)
  } catch (cause) {
    target.reportError(
      `failed to open the launch workspace ${path}: ${cause instanceof Error ? cause.message : String(cause)}`,
    )
  }
}

/**
 * Publish the launch-folder seam and drain anything delivered before it existed.
 *
 * The main process never waits for this plugin to install, so a folder that
 * arrives first is parked on the page and collected here. That removes the
 * timing dependency in both directions.
 * @param target - client-context seam.
 * @param globalTarget - page object carrying the seam.
 * @returns disposer restoring whatever held the seam before.
 */
export function installDesktopLaunchWorkspaceBridge(
  target: DesktopLaunchWorkspaceTarget,
  globalTarget: DesktopLaunchWorkspaceWindow = window as DesktopLaunchWorkspaceWindow,
): () => void {
  const open = (path: string): void => { void openDesktopLaunchWorkspace(target, path) }
  const previous = globalTarget[DESKTOP_OPEN_WORKSPACE_GLOBAL]
  globalTarget[DESKTOP_OPEN_WORKSPACE_GLOBAL] = open

  const parked = globalTarget[DESKTOP_PENDING_WORKSPACE_GLOBAL]
  if (parked !== undefined) {
    delete globalTarget[DESKTOP_PENDING_WORKSPACE_GLOBAL]
    open(parked)
  }

  return () => {
    if (globalTarget[DESKTOP_OPEN_WORKSPACE_GLOBAL] !== open) return
    if (previous === undefined) delete globalTarget[DESKTOP_OPEN_WORKSPACE_GLOBAL]
    else globalTarget[DESKTOP_OPEN_WORKSPACE_GLOBAL] = previous
  }
}
