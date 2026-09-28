/** IPC carrier for the shared native Desktop permission service. */
import type { DesktopPermissions } from './permissions.ts'

export const DESKTOP_PERMISSIONS_CHANNEL = 'dsh-desktop:permissions'
export const DESKTOP_PERMISSIONS_BRIDGE = 'dshDesktopPermissions'

declare global {
  interface Window {
    readonly dshDesktopPermissions?: DesktopPermissions
  }
}
