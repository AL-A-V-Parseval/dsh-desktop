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
  --dsh-glass-control-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 26%, transparent);
  --dsh-glass-popover-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 30%, transparent);
  --dsh-glass-control-border: color-mix(in srgb, #ffffff 6%, transparent);
  --dsh-glass-control-rim: color-mix(in srgb, #ffffff 3%, transparent);
  --dsh-glass-popover-border: color-mix(in srgb, #ffffff 28%, transparent);
  /* Specular edge: a bright top hairline, a shaded bottom edge,
     and a faint rim, with the centre kept clear instead of lit. */
  --dsh-glass-edge-light: color-mix(in srgb, #ffffff 30%, transparent);
  --dsh-glass-edge-shade: color-mix(in srgb, #000000 30%, transparent);
  --dsh-glass-edge-rim: color-mix(in srgb, #ffffff 10%, transparent);
  --dsh-glass-edge: inset 0 1px 0 var(--dsh-glass-edge-light), inset 0 -1px 1px var(--dsh-glass-edge-shade), inset 0 0 0 1px var(--dsh-glass-edge-rim);
  --dsh-glass-lift: 0 2px 6px color-mix(in srgb, #000000 30%, transparent);
  --dsh-glass-surface-overlay: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-layer-1) 24%, transparent), color-mix(in srgb, var(--dsw-alias-bg-layer-1) 34%, transparent));
  --dsh-glass-control-blur: blur(16px) saturate(160%);
  --dsh-glass-popover-blur: blur(22px) saturate(170%);
  --dsh-glass-surface-blur: blur(20px) saturate(160%);
  --dsh-glass-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E");
  --dsh-glass-shadow: 0 24px 64px color-mix(in srgb, #000000 44%, transparent), inset 0 1px 0 color-mix(in srgb, #ffffff 26%, transparent), inset 0 -1px 0 color-mix(in srgb, #000000 26%, transparent);
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
  border-color: transparent;
  box-shadow: var(--dsh-glass-edge);
}
/* Third-party controls (dropdown triggers, appearance cards, settings nav):
   replace the control's own fill with a translucent glass so the shared
   backdrop-filter actually frosts what is behind it, instead of covering it
   with an opaque fill. Selected/active states (aria-pressed / aria-current)
   and hover keep a stronger translucent fill so they stay distinguishable. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_selector"],
  [class*="_stepper"],
  [class*="_themeCube"],
  [class*="_navCell"],
  [class*="_arrow"]
) {
  background-color: transparent !important;
  background-image: var(--dsh-glass-noise);
  background-size: 140px 140px;
  -webkit-backdrop-filter: var(--dsh-glass-control-blur);
  backdrop-filter: var(--dsh-glass-control-blur);
  box-shadow: var(--dsh-glass-lift), var(--dsh-glass-edge);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_themeCube"][aria-pressed="true"],
  [class*="_navCell"][aria-current="true"]
) {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 84%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_themeCube"]:hover:not([aria-pressed="true"]),
  [class*="_navCell"]:hover:not([aria-current="true"])
) {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 68%, transparent) !important;
}
/* Message actions (copy, good answer, bad answer, branch) and the usage/time
   readouts share one glass capsule, split into segments by hairlines. Only rows
   that carry the feedback pair get it, so single-action rows stay untouched.
   The centre stays clear: each segment carries a flat fill plus a specular top
   and bottom edge, with no broad sheen. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) {
  gap: 0;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) :is(
  [class~="_8leB5q_action"],
  [class~="gDWXgG_action"],
  [class~="nCk46q_root"]
) {
  background-color: color-mix(in srgb, #ffffff 4%, transparent) !important;
  background-image: var(--dsh-glass-noise);
  background-size: 140px 140px;
  border-radius: 0;
  -webkit-backdrop-filter: var(--dsh-glass-control-blur);
  backdrop-filter: var(--dsh-glass-control-blur);
  box-shadow: inset 0 1px 0 var(--dsh-glass-edge-light), inset 0 -1px 1px var(--dsh-glass-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) :is(
  [class~="gDWXgG_action"],
  [class~="nCk46q_root"]
),
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_action"]:not(:first-child) {
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 12%, transparent), inset 0 1px 0 var(--dsh-glass-edge-light), inset 0 -1px 1px var(--dsh-glass-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_action"]:first-child {
  border-radius: 999px 0 0 999px;
  box-shadow: inset 1px 0 0 var(--dsh-glass-edge-rim), inset 0 1px 0 var(--dsh-glass-edge-light), inset 0 -1px 1px var(--dsh-glass-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) [class~="nCk46q_root"]:has(+ [class~="_8leB5q_timeEnd"]) {
  border-radius: 0 999px 999px 0;
  box-shadow: inset -1px 0 0 var(--dsh-glass-edge-rim), inset 1px 0 0 color-mix(in srgb, #ffffff 12%, transparent), inset 0 1px 0 var(--dsh-glass-edge-light), inset 0 -1px 1px var(--dsh-glass-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) [class~="nCk46q_trigger"] {
  background-color: transparent !important;
  background-image: none;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_timeEnd"] {
  margin-left: 10px;
}
/* Settings and other modals: frost the dialog surface itself. A translucent
   control sitting on an opaque panel reads as a flat fill, so the panel has
   to carry the material too for the controls on top of it to look like
   liquid glass. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [aria-modal="true"] {
  background-color: transparent !important;
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-layer-2) 26%, transparent), color-mix(in srgb, var(--dsw-alias-bg-layer-2) 34%, transparent)), var(--dsh-glass-noise);
  background-size: 100% 100%, 140px 140px;
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
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
  box-shadow: var(--dsh-glass-edge), inset -1px 0 0 color-mix(in srgb, #ffffff 8%, transparent);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [data-slot="conversation.composer"] [class*="_card"] {
  background-color: transparent !important;
  background-image: var(--dsh-glass-surface-overlay), var(--dsh-glass-noise);
  background-size: 100% 100%, 140px 140px;
  /* The frost sits on a ::before layer instead of the card itself. A
     backdrop-filter on the card becomes the backdrop root for the inline menus
     rendered inside it (the access-mode menu is not portalled), leaving their
     own backdrop-filter nothing to frost and making them see-through next to
     the portalled model/context menus. */
  isolation: isolate;
  box-shadow: var(--dsh-glass-lift), var(--dsh-glass-edge);
  border-color: transparent;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [data-slot="conversation.composer"] [class*="_card"]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  -webkit-backdrop-filter: var(--dsh-glass-surface-blur);
  backdrop-filter: var(--dsh-glass-surface-blur);
}
/* Menus, listboxes, and popovers. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  [role="dialog"]:not([aria-modal="true"]),
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
/* Glass motion: popovers and menus spring in, the modal glass settles, and
   controls press/raise with short springy easings rather than snapping. */
@keyframes dsh-glass-pop-in {
  from { opacity: 0; transform: scale(0.94) translateY(-6px); filter: blur(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}
@keyframes dsh-glass-modal-in {
  from { opacity: 0; transform: scale(0.975) translateY(10px); filter: blur(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) :is(
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  .dshDesktopVersionPopover,
  .dshDesktopActionMenu,
  .dshDesktopSettingsMenu,
  .dshShadcnHoverCardContent
) {
  animation: dsh-glass-pop-in 280ms cubic-bezier(0.22, 1.2, 0.36, 1) backwards;
  transform-origin: top center;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) [aria-modal="true"] {
  animation: dsh-glass-modal-in 320ms cubic-bezier(0.22, 1.1, 0.36, 1) backwards;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) :is(
  [class*="_selector"],
  [class*="_stepper"],
  [class*="_themeCube"],
  [class*="_navCell"],
  [class*="_arrow"],
  .dshDesktopSettingsSelect,
  .dshDesktopSettingsInput,
  .dshDesktopSettingsButton,
  .dshDesktopSettingsButtonSecondary,
  .dshDesktopSettingsButtonDanger,
  .dshDesktopSettingsHeaderButton,
  .dshDesktopSettingsBadge
) {
  transition: transform 150ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) :is(
  [class*="_selector"],
  [class*="_stepper"],
  [class*="_themeCube"],
  [class*="_navCell"],
  [class*="_arrow"],
  .dshDesktopSettingsSelect,
  .dshDesktopSettingsInput,
  .dshDesktopSettingsButton,
  .dshDesktopSettingsButtonSecondary,
  .dshDesktopSettingsButtonDanger,
  .dshDesktopSettingsHeaderButton,
  .dshDesktopSettingsBadge
):active {
  transform: scale(0.97);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) :is(
  [class*="_themeCube"],
  [class*="_navCell"]
):hover:not(:active) {
  transform: translateY(-1px);
}
/* The upstream menus unmount with no exit state, so the retract plays on a
   fixed clone that installGlassExitAnimations() mirrors before it is dropped. */
@keyframes dsh-glass-pop-out {
  from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
  to { opacity: 0; transform: scale(0.96) translateY(-4px); filter: blur(5px); }
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-dsh-desktop-motion="off"]) .dshGlassRetract {
  animation: dsh-glass-pop-out 180ms cubic-bezier(0.4, 0, 1, 1) forwards;
  transform-origin: top center;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"][data-dsh-desktop-motion="off"] .dshGlassRetract {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
    [role="menu"],
    [role="listbox"],
    [role="tooltip"],
    [aria-modal="true"],
    [class*="_selector"],
    [class*="_stepper"],
    [class*="_themeCube"],
    [class*="_navCell"],
    [class*="_arrow"],
    .dshDesktopVersionPopover,
    .dshDesktopActionMenu,
    .dshDesktopSettingsMenu,
    .dshShadcnHoverCardContent
  ) {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
  body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshGlassRetract {
    display: none !important;
  }
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

const GLASS_POPOVER_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="tooltip"]',
  '.dshDesktopVersionPopover',
  '.dshDesktopActionMenu',
  '.dshDesktopSettingsMenu',
  '.dshShadcnHoverCardContent',
].join(', ')

/**
 * Upstream unmounts menus, listboxes, and popovers immediately, so the pop-in
 * animation has no counterpart. A MutationObserver only sees the node after it
 * is detached, where its rect is already 0x0, so instead hook the DOM removal
 * calls to capture the rect while the popover is still laid out, then mirror it
 * as a fixed, inert clone and run the retract animation before dropping it.
 */
export function installGlassExitAnimations(): () => void {
  if (typeof Node === 'undefined' || typeof document === 'undefined' || !document.body) return () => {}
  if (document.body.dataset.dshGlassExit === 'on') return () => {}
  document.body.dataset.dshGlassExit = 'on'

  const pending = new Map<HTMLElement, DOMRect>()
  const handled = new WeakSet<HTMLElement>()
  const retract = (node: HTMLElement, rect: DOMRect): void => {
    if (rect.width < 8 || rect.height < 8) return
    const clone = node.cloneNode(true) as HTMLElement
    clone.classList.add('dshGlassRetract')
    clone.setAttribute('aria-hidden', 'true')
    clone.style.position = 'fixed'
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.margin = '0'
    clone.style.pointerEvents = 'none'
    document.body.appendChild(clone)
    let done = false
    const drop = (): void => { if (done) return; done = true; clone.remove() }
    clone.addEventListener('animationend', drop, { once: true })
    window.setTimeout(drop, 400)
  }
  let scheduled = false
  const flush = (): void => {
    scheduled = false
    const items = [...pending.entries()]
    pending.clear()
    for (const [node, rect] of items) retract(node, rect)
  }
  const consider = (node: Node | null): void => {
    if (!(node instanceof HTMLElement) || handled.has(node)) return
    if (node.classList.contains('dshGlassRetract') || node.closest('.dshGlassRetract')) return
    if (document.body.dataset.dshDesktopPlatform !== 'linux') return
    if (document.body.dataset.dshDesktopMaterial !== 'transparent') return
    if (document.body.dataset.dshDesktopMotion === 'off') return
    const target = node.matches(GLASS_POPOVER_SELECTOR) ? node : node.querySelector(GLASS_POPOVER_SELECTOR)
    if (!(target instanceof HTMLElement) || handled.has(target)) return
    handled.add(target)
    pending.set(target, target.getBoundingClientRect())
    if (scheduled) return
    scheduled = true
    ;(window.requestAnimationFrame ?? (cb => window.setTimeout(cb, 16)))(flush)
  }

  const proto = Node.prototype
  const elementProto = Element.prototype
  const originalRemoveChild = proto.removeChild
  const originalReplaceChild = proto.replaceChild
  const originalRemove = elementProto.remove
  proto.removeChild = function <T extends Node>(child: T): T {
    consider(child)
    return originalRemoveChild.call(this, child) as T
  }
  proto.replaceChild = function <T extends Node>(newChild: Node, oldChild: T): T {
    consider(oldChild)
    return originalReplaceChild.call(this, newChild, oldChild) as T
  }
  elementProto.remove = function (): void {
    consider(this)
    originalRemove.call(this)
  }

  return () => {
    proto.removeChild = originalRemoveChild
    proto.replaceChild = originalReplaceChild
    elementProto.remove = originalRemove
    delete document.body.dataset.dshGlassExit
  }
}
