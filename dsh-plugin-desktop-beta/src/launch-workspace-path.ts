import { posix, win32 } from 'node:path'

/**
 * Explicit launcher hand-off naming the folder to register as a workspace.
 *
 * The npm launcher spawns Electron with its own `main.js` entry, so a bare
 * folder argument would be indistinguishable from a background Node re-entry
 * once it reaches the running instance. The flag keeps the two apart.
 */
export const DESKTOP_WORKSPACE_ARGUMENT = '--dsh-desktop-workspace'

/** One folder hand-off recovered from a process command line. */
export interface DesktopLaunchWorkspaceRequest {
  /** Absolute folder the launch asked Desktop to open. */
  readonly path: string
  /** Whether the launcher named the folder through its own flag. */
  readonly explicit: boolean
}

const NODE_ENTRY = /\.(?:c|m)?js$/iu

/** Judge absoluteness with the semantics of the launching platform. */
function isAbsoluteLaunchPath(value: string, platform: NodeJS.Platform): boolean {
  return platform === 'win32' ? win32.isAbsolute(value) : posix.isAbsolute(value)
}

/**
 * Locate the hand-off within one argument tail.
 * @returns index of the flag or of the accepted bare argument, `-1` when absent.
 */
function launchWorkspaceIndex(args: readonly string[], platform: NodeJS.Platform): number {
  const flag = args.indexOf(DESKTOP_WORKSPACE_ARGUMENT)
  if (flag >= 0) return flag
  return args.findIndex(argument => !argument.startsWith('-')
    && !NODE_ENTRY.test(argument)
    && isAbsoluteLaunchPath(argument, platform))
}

/**
 * Recover a folder hand-off from one argument tail.
 * @param args - arguments after the executable.
 * @param platform - platform whose path semantics apply.
 * @returns the requested folder, or `undefined` when the launch named none.
 */
export function desktopLaunchWorkspaceFromArguments(
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
): DesktopLaunchWorkspaceRequest | undefined {
  const index = launchWorkspaceIndex(args, platform)
  if (index < 0) return undefined
  if (args[index] !== DESKTOP_WORKSPACE_ARGUMENT) return { path: args[index]!, explicit: false }
  const value = args[index + 1]
  if (value === undefined || !isAbsoluteLaunchPath(value, platform)) return undefined
  return { path: value, explicit: true }
}

/**
 * Recover a folder hand-off from a complete command line.
 * @param argv - command line including the executable at index zero.
 * @param platform - platform whose path semantics apply.
 * @returns the requested folder, or `undefined` when the launch named none.
 */
export function desktopLaunchWorkspaceRequest(
  argv: readonly string[] = process.argv,
  platform: NodeJS.Platform = process.platform,
): DesktopLaunchWorkspaceRequest | undefined {
  return desktopLaunchWorkspaceFromArguments(argv.slice(1), platform)
}

/**
 * Drop a folder hand-off so one launch never survives into a relaunch.
 * @param args - arguments after the executable.
 * @param platform - platform whose path semantics apply.
 * @returns the same arguments without the hand-off.
 */
export function desktopArgumentsWithoutLaunchWorkspace(
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
): string[] {
  const index = launchWorkspaceIndex(args, platform)
  if (index < 0) return [...args]
  const value = args[index + 1]
  const consumed = args[index] === DESKTOP_WORKSPACE_ARGUMENT
    && value !== undefined
    && !value.startsWith('-')
    ? 2
    : 1
  return [...args.slice(0, index), ...args.slice(index + consumed)]
}
