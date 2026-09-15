import {
  ADVANCED_MACOS_CONTENT_INSET,
  ADVANCED_MACOS_DRAG_LAYER_Z_INDEX,
  ADVANCED_MACOS_DRAG_REGION_HEIGHT,
  ADVANCED_WINDOWS_TITLEBAR_HEIGHT,
  LINUX_CAPTION_CONTROLS_WIDTH,
  MACOS_TRAFFIC_LIGHT_SAFE_WIDTH,
  WINDOWS_CAPTION_CONTROLS_WIDTH,
} from '../window-chrome.ts'
import { SIDEBAR_COLLAPSED } from './layout-state.ts'

/** Desktop-owned shell stylesheet kept as a plain string so the client bundle stays self-contained. */
const DESKTOP_OWNED_STYLES = `
html, body, #root { width: 100%; height: 100%; }
body:is([data-dsh-desktop-mode="extended"], [data-dsh-desktop-mode="advanced"]) { margin: 0; background: transparent !important; }
.dshDesktopFrame { position: relative; display: grid; grid-template-rows: 100%; width: 100%; height: 100%; overflow: hidden; background: transparent; transition: grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out); }
.dshDesktopSidebarSurface { --dsw-specific-sidebar-fill: transparent; position: relative; grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; background: transparent; border-right: 1px solid var(--dsw-alias-border-l1); }
body:is([data-dsh-desktop-mode="extended"], [data-dsh-desktop-mode="advanced"])[data-dsh-desktop-material="off"] .dshDesktopSidebarSurface { --dsw-specific-sidebar-fill: var(--dsw-alias-bg-layer-1); background: var(--dsw-alias-bg-layer-1); }
.dshDesktopUpstreamSidebar { box-sizing: border-box; width: 100%; height: 100%; }
body:is([data-dsh-desktop-mode="extended"], [data-dsh-desktop-mode="advanced"]) [data-slot="sidebar.footer.action"] { display: flex !important; flex-direction: column; gap: 6px; min-width: 0; width: 100%; max-height: min(40vh, 240px); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
body:is([data-dsh-desktop-mode="extended"], [data-dsh-desktop-mode="advanced"]) [data-slot="sidebar.footer.action"] > * { flex: none; min-width: 0; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] .dshDesktopUpstreamSidebar { padding-top: ${ADVANCED_MACOS_CONTENT_INSET}px; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"][data-sidebar-collapsed] .dshDesktopUpstreamSidebar { width: ${SIDEBAR_COLLAPSED}px; margin: 0 auto; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] { grid-template-rows: ${ADVANCED_MACOS_DRAG_REGION_HEIGHT}px minmax(0, 1fr); }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] .dshDesktopSidebarSurface { grid-row: 1 / -1; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] .dshDesktopConversationSurface,
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] .dshDesktopRightbarSurface { grid-row: 2; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="darwin"] .dshDesktopSidebarSurface::before { content: ""; position: absolute; z-index: ${ADVANCED_MACOS_DRAG_LAYER_Z_INDEX}; top: 0; right: 0; left: ${MACOS_TRAFFIC_LIGHT_SAFE_WIDTH}px; height: ${ADVANCED_MACOS_DRAG_REGION_HEIGHT}px; user-select: none; -webkit-app-region: drag; }
.dshDesktopMacCaptionRow { position: absolute; z-index: ${ADVANCED_MACOS_DRAG_LAYER_Z_INDEX}; grid-column: 2 / -1; grid-row: 1; top: 0; right: 0; left: 0; height: ${ADVANCED_MACOS_DRAG_REGION_HEIGHT}px; background: var(--dsw-alias-bg-base); user-select: none; -webkit-app-region: drag; }
.dshDesktopConversationSurface { grid-column: 2; grid-row: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--dsw-alias-bg-base); }
.dshDesktopRightbarSurface { position: relative; grid-column: 3; grid-row: 1; min-width: 0; min-height: 0; overflow: visible; }
.dshDesktopFrame[data-rightbar-fullscreen], .dshDesktopFrame[data-rightbar-fullscreen] .dshDesktopResizeHandle { transition: none; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="win32"] { grid-template-rows: ${ADVANCED_WINDOWS_TITLEBAR_HEIGHT}px minmax(0, 1fr); }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="linux"] { grid-template-rows: ${ADVANCED_WINDOWS_TITLEBAR_HEIGHT}px minmax(0, 1fr); }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="win32"] .dshDesktopSidebarSurface { grid-row: 1 / -1; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="linux"] .dshDesktopSidebarSurface { grid-row: 1 / -1; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="win32"] .dshDesktopConversationSurface,
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="win32"] .dshDesktopRightbarSurface { grid-row: 2; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="linux"] .dshDesktopConversationSurface,
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="linux"] .dshDesktopRightbarSurface { grid-row: 2; }
.dshDesktopWindowsCaptionRow { position: relative; grid-column: 2 / -1; grid-row: 1; min-width: 0; background: var(--dsw-alias-bg-base); }
.dshDesktopWindowsCaptionRow::before { content: ""; position: absolute; inset: 0 ${WINDOWS_CAPTION_CONTROLS_WIDTH}px 0 0; user-select: none; -webkit-app-region: drag; }
.dshDesktopFrame[data-desktop-mode="advanced"][data-desktop-platform="linux"] .dshDesktopWindowsCaptionRow::before { inset: 0 ${LINUX_CAPTION_CONTROLS_WIDTH}px 0 0; }
.dshDesktopFrame[data-dragging] { transition: none; }
.dshDesktopOverlay { position: absolute; z-index: 1000; inset: 0; pointer-events: none; }
.dshDesktopOverlay > * { pointer-events: auto; }
.dshDesktopResizeHandle { position: absolute; z-index: 50; top: 0; bottom: 0; width: 8px; margin-left: -4px; cursor: col-resize; touch-action: none; -webkit-app-region: no-drag; transition: left var(--ds-transition-duration-slow) var(--ds-ease-in-out); }
.dshDesktopFrame[data-dragging] .dshDesktopResizeHandle { transition: none; }
.dshDesktopNoDrag, button, input, textarea, select, label, summary, a, [contenteditable="true"], [role="button"], [role="checkbox"], [role="dialog"], [role="menuitem"], [role="option"], [role="switch"], [role="tab"] { -webkit-app-region: no-drag !important; }
[role="dialog"], [aria-modal="true"] { -webkit-app-region: no-drag !important; }
html:has([aria-modal="true"]) .dshDesktopWindowsCaptionRow::before { -webkit-app-region: no-drag !important; }
@media (prefers-reduced-motion: reduce) {
  .dshDesktopFrame,
  .dshDesktopResizeHandle { transition: none !important; }
}
/* WWDC25-style liquid glass restricted to controls, menus, and popovers. The
   settings panel and the app surfaces stay solid. Scoped to the Linux material. */
/* iOS-style background recede while a popover is open. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] #root {
  transition: filter 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:has(
  [role="menu"],
  [role="listbox"],
  .dshDesktopSettingsMenu,
  .dshDesktopActionMenu
) #root {
  filter: brightness(0.94) saturate(0.94);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] {
  --dsh-glass-control-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 44%, transparent);
  --dsh-glass-popover-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 40%, transparent);
  --dsh-glass-control-border: color-mix(in srgb, #ffffff 24%, transparent);
  --dsh-glass-popover-border: color-mix(in srgb, #ffffff 28%, transparent);
  --dsh-glass-surface-overlay: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-layer-1) 30%, transparent), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 44%, transparent));
  --dsh-glass-control-blur: blur(16px) saturate(160%);
  --dsh-glass-popover-blur: blur(22px) saturate(170%);
  --dsh-glass-surface-blur: blur(20px) saturate(160%);
  --dsh-glass-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E");
  --dsh-glass-shadow: 0 24px 64px color-mix(in srgb, #000000 44%, transparent), inset 0 1px 0 color-mix(in srgb, #ffffff 16%, transparent);
}
/* Desktop-owned controls: full glass; we own their state styling. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  .dshDesktopSettingsSelect,
  .dshDesktopSettingsInput,
  .dshDesktopSettingsButton,
  .dshDesktopSettingsButtonSecondary,
  .dshDesktopSettingsButtonDanger,
  .dshDesktopSettingsHeaderButton,
  .dshDesktopSettingsBadge
) {
  background-color: var(--dsh-glass-control-fill) !important;
  background-image: var(--dsh-glass-noise);
  background-size: 140px 140px;
  -webkit-backdrop-filter: var(--dsh-glass-control-blur);
  backdrop-filter: var(--dsh-glass-control-blur);
  border-color: var(--dsh-glass-control-border);
}
/* Third-party controls: overlay the glass as a translucent layer and a rim
   shadow, leaving the plugin's own background, border, and selected/active/
   hover states intact. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_selector"],
  [class*="_stepper"],
  [class*="_themeCube"],
  [class*="_navCell"],
  [class*="_arrow"]
) {
  background-image:
    linear-gradient(180deg, color-mix(in srgb, #ffffff 10%, transparent), color-mix(in srgb, #ffffff 2%, transparent)),
    var(--dsh-glass-noise);
  background-size: 100% 100%, 140px 140px;
  -webkit-backdrop-filter: var(--dsh-glass-control-blur);
  backdrop-filter: var(--dsh-glass-control-blur);
  box-shadow: inset 0 0 0 1px var(--dsh-glass-control-border);
}
/* Sidebar and message box: overlay the frosted material on top of whatever
   background the theme or a third-party appearance plugin painted (wallpaper,
   sidebar transparency) instead of overriding it, so plugins keep control of
   their fill and opacity.
   The sidebar must not use a backdrop-filter: it would become the containing
   block for the fixed Settings overlay hosted inside the sidebar and collapse
   it to the sidebar width. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshDesktopSidebarSurface::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--dsh-glass-surface-overlay), var(--dsh-glass-noise);
  background-size: 100% 100%, 140px 140px;
  box-shadow: inset 0 0 0 1px var(--dsh-glass-control-border), inset -1px 0 0 color-mix(in srgb, #ffffff 8%, transparent);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [data-slot="conversation.composer"] [class*="_card"] {
  background-image: var(--dsh-glass-surface-overlay), var(--dsh-glass-noise);
  background-size: 100% 100%, 140px 140px;
  -webkit-backdrop-filter: var(--dsh-glass-surface-blur);
  backdrop-filter: var(--dsh-glass-surface-blur);
  box-shadow: inset 0 0 0 1px var(--dsh-glass-control-border);
  border-color: var(--dsh-glass-control-border);
}
/* Menus, listboxes, and popovers. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  .dshDesktopVersionPopover,
  .dshDesktopActionMenu,
  .dshDesktopSettingsMenu,
  .dshShadcnHoverCardContent
) {
  background-color: var(--dsh-glass-popover-fill) !important;
  background-image: var(--dsh-glass-noise);
  background-size: 140px 140px;
  -webkit-backdrop-filter: var(--dsh-glass-popover-blur);
  backdrop-filter: var(--dsh-glass-popover-blur);
  border: 1px solid var(--dsh-glass-popover-border);
  box-shadow: var(--dsh-glass-shadow);
  color: var(--dsw-alias-label-primary);
}
`

/** Install shared panel styles; mode selectors keep enhanced and extended chrome independent. */
export function installDesktopOwnedStyles(): () => void {
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-plugin-desktop'
  style.dataset.pluginCss = 'dsh-plugin-desktop/desktop-owned-layout'
  style.textContent = DESKTOP_OWNED_STYLES
  document.head.appendChild(style)
  return () => { style.remove() }
}
