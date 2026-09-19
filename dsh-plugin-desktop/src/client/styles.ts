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

/* =====================================================================
   Liquid Glass — WWDC25 material for the Linux transparent window.
   The BrowserWindow is transparent, so the compositor frosts the desktop
   wallpaper behind every surface; this layer supplies the tint, the
   specular edges, the depth, and the region hierarchy. Scoped to the
   Linux transparent material so other platforms keep their native material.
   ===================================================================== */
/* iOS-style background recede while a popover is open. A dimming overlay is
   used instead of a filter: a filter on #root becomes a backdrop root and
   silently disables every popover's backdrop-filter, so the glass would show
   sharp content behind it. The overlay sits below the portalled popovers. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] #root::before {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  pointer-events: none;
  background: #000000;
  opacity: 0;
  transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:has(
  [role="menu"],
  [role="listbox"],
  .dshDesktopSettingsMenu,
  .dshDesktopActionMenu
) #root::before {
  opacity: 0.18;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] {
  --dsh-lg-blur-chrome: blur(30px) saturate(190%);
  --dsh-lg-blur-control: blur(26px) saturate(185%);
  --dsh-lg-blur-popover: blur(64px) saturate(215%);
  --dsh-lg-blur-surface: blur(40px) saturate(195%);
  /* Edge refraction: the SVG filter is injected by installDesktopOwnedStyles.
     Set to none to fall back to plain frosted glass. */
  --dsh-lg-refract: url(#dsh-lg-refract);
  /* The shell keeps its original dark base; the glass is reserved for the
     controls, the composer, and the floating layers that sit on top of it. */
  --dsh-lg-tint-base: var(--dsw-static-neutral-bluish-950);
  --dsh-lg-tint-1: var(--dsw-static-neutral-bluish-875);
  --dsh-lg-tint-2: var(--dsw-static-neutral-bluish-850);
  --dsh-lg-tint-3: var(--dsw-static-neutral-bluish-800);
  --dsh-lg-tint-control: color-mix(in srgb, #ffffff 7%, transparent);
  --dsh-lg-tint-popover: color-mix(in srgb, var(--dsw-static-neutral-bluish-850) 46%, transparent);
  --dsh-lg-tint-card: color-mix(in srgb, var(--dsw-static-neutral-bluish-850) 50%, transparent);
  --dsh-lg-tint-sidebar: linear-gradient(180deg, var(--dsw-static-neutral-bluish-900), var(--dsw-static-neutral-bluish-950));
  --dsh-lg-edge-light: color-mix(in srgb, #ffffff 46%, transparent);
  --dsh-lg-edge-shade: color-mix(in srgb, #000000 42%, transparent);
  --dsh-lg-edge-rim: color-mix(in srgb, #ffffff 15%, transparent);
  --dsh-lg-edge: inset 0 1px 0 var(--dsh-lg-edge-light), inset 0 -1px 1px var(--dsh-lg-edge-shade), inset 0 0 0 1px var(--dsh-lg-edge-rim);
  --dsh-lg-lift: 0 12px 34px color-mix(in srgb, #000000 40%, transparent);
  --dsh-lg-shadow: 0 26px 70px color-mix(in srgb, #000000 52%, transparent), inset 0 1px 0 color-mix(in srgb, #ffffff 30%, transparent), inset 0 -1px 0 color-mix(in srgb, #000000 30%, transparent);
  /* Apple's glass is a clean material, not a frosted one: the grain stays
     near-invisible, matching the compositor blur settings. */
  --dsh-lg-noise: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  /* Surface tokens turn into translucent glass so every component that paints
     from the alias scale participates instead of staying opaque. The glass
     tint derives from the shared static scale, so a custom theme's palette is
     respected while a theme wallpaper keeps showing through. */
  --dsw-alias-bg-base: var(--dsh-lg-tint-base);
  --dsw-alias-bg-layer-1: var(--dsh-lg-tint-1);
  --dsw-alias-bg-layer-2: var(--dsh-lg-tint-2);
  --dsw-alias-bg-layer-3: var(--dsh-lg-tint-3);
  --dsw-alias-bg-module-platform: color-mix(in srgb, var(--dsw-static-neutral-bluish-800) 74%, transparent);
  --dsw-alias-bg-multi-select: color-mix(in srgb, var(--dsw-static-neutral-850) 78%, transparent);
  --dsw-alias-bg-overlay: color-mix(in srgb, var(--dsw-static-neutral-bluish-700) 80%, transparent);
  --dsw-alias-button-elevated-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-750) 72%, transparent);
  --dsw-alias-button-floating-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-850) 72%, transparent);
  --dsw-alias-button-floating-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-800) 78%, transparent);
  --dsw-alias-button-ghost-active-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-750) 72%, transparent);
  --dsw-alias-button-ghost-active-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-700) 78%, transparent);
  --dsw-alias-button-primary-dimmed: color-mix(in srgb, var(--dsw-static-neutral-bluish-750) 68%, transparent);
  --dsw-alias-button-tool-bar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-600) 62%, transparent);
  --dsw-alias-button-tool-bar-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-600) 76%, transparent);
  --dsw-alias-toast-bg: color-mix(in srgb, var(--dsw-static-neutral-bluish-750) 82%, transparent);
  --dsw-alias-tooltip-bg: color-mix(in srgb, var(--dsw-static-neutral-bluish-750) 84%, transparent);
  --dsw-alias-interactive-bg-hover-solid: color-mix(in srgb, var(--dsw-static-neutral-bluish-800) 74%, transparent);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"]:not([data-ds-dark-theme]) {
  --dsh-lg-tint-base: var(--dsw-static-neutral-bluish-00);
  --dsh-lg-tint-1: var(--dsw-static-neutral-bluish-50);
  --dsh-lg-tint-2: var(--dsw-static-neutral-bluish-75);
  --dsh-lg-tint-3: var(--dsw-static-neutral-bluish-100);
  --dsh-lg-tint-control: color-mix(in srgb, #ffffff 42%, transparent);
  --dsh-lg-tint-popover: color-mix(in srgb, var(--dsw-static-neutral-bluish-00) 60%, transparent);
  --dsh-lg-tint-card: color-mix(in srgb, var(--dsw-static-neutral-bluish-00) 60%, transparent);
  --dsh-lg-tint-sidebar: linear-gradient(180deg, var(--dsw-static-neutral-bluish-00), var(--dsw-static-neutral-bluish-100));
  --dsh-lg-edge-light: color-mix(in srgb, #ffffff 88%, transparent);
  --dsh-lg-edge-shade: color-mix(in srgb, #000000 12%, transparent);
  --dsh-lg-edge-rim: color-mix(in srgb, #000000 8%, transparent);
  --dsh-lg-lift: 0 12px 34px color-mix(in srgb, #000000 16%, transparent);
  --dsh-lg-shadow: 0 26px 70px color-mix(in srgb, #000000 22%, transparent), inset 0 1px 0 color-mix(in srgb, #ffffff 80%, transparent), inset 0 -1px 0 color-mix(in srgb, #000000 8%, transparent);
  --dsw-alias-bg-module-platform: color-mix(in srgb, var(--dsw-static-neutral-bluish-60) 62%, transparent);
  --dsw-alias-bg-multi-select: color-mix(in srgb, var(--dsw-static-neutral-bluish-60) 60%, transparent);
  --dsw-alias-bg-overlay: color-mix(in srgb, var(--dsw-static-neutral-bluish-150) 62%, transparent);
  --dsw-alias-button-elevated-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-00) 66%, transparent);
  --dsw-alias-button-floating-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-00) 60%, transparent);
  --dsw-alias-button-floating-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-75) 64%, transparent);
  --dsw-alias-button-ghost-active-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-100) 60%, transparent);
  --dsw-alias-button-ghost-active-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-150) 62%, transparent);
  --dsw-alias-button-primary-dimmed: color-mix(in srgb, var(--dsw-static-neutral-bluish-100) 58%, transparent);
  --dsw-alias-button-tool-bar-fill: color-mix(in srgb, var(--dsw-static-neutral-bluish-400) 42%, transparent);
  --dsw-alias-button-tool-bar-hover: color-mix(in srgb, var(--dsw-static-neutral-bluish-400) 56%, transparent);
  --dsw-alias-toast-bg: color-mix(in srgb, var(--dsw-static-neutral-bluish-800) 62%, transparent);
  --dsw-alias-tooltip-bg: color-mix(in srgb, var(--dsw-static-neutral-bluish-850) 66%, transparent);
  --dsw-alias-interactive-bg-hover-solid: color-mix(in srgb, var(--dsw-static-neutral-bluish-75) 58%, transparent);
}
/* The frame is the glass pane the compositor frosts. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshDesktopFrame {
  background: var(--dsh-lg-tint-base) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshDesktopFrameTitlebar {
  --dsh-desktop-frame-fill: var(--dsh-lg-tint-1);
  background-image: var(--dsh-lg-noise);
  background-size: 140px 140px;
  border-bottom: 1px solid color-mix(in srgb, #ffffff 12%, transparent);
}
/* Region hierarchy: the conversation reads on the frame glass, the sidebar
   adds a slightly deeper tint, and the composer floats above both. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshDesktopConversationSurface {
  background: transparent !important;
  border-color: color-mix(in srgb, #ffffff 12%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] .dshDesktopSidebarSurface::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--dsh-lg-tint-sidebar), var(--dsh-lg-noise);
  background-size: 100% 100%, 140px 140px;
  box-shadow: var(--dsh-lg-edge), inset -1px 0 0 color-mix(in srgb, #ffffff 10%, transparent);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [data-slot="conversation.composer"] [class*="_card"] {
  background-color: transparent !important;
  background-image: var(--dsh-lg-tint-card), var(--dsh-lg-noise);
  background-size: 100% 100%, 140px 140px;
  /* The frost sits on a ::before layer instead of the card itself. A
     backdrop-filter on the card becomes the backdrop root for the inline menus
     rendered inside it (the access-mode menu is not portalled), leaving their
     own backdrop-filter nothing to frost and making them see-through next to
     the portalled model/context menus. */
  isolation: isolate;
  box-shadow: var(--dsh-lg-lift), var(--dsh-lg-edge);
  border-color: transparent;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [data-slot="conversation.composer"] [class*="_card"]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  -webkit-backdrop-filter: var(--dsh-lg-blur-surface);
  backdrop-filter: var(--dsh-lg-blur-surface);
  filter: var(--dsh-lg-refract);
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
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise);
  background-size: 140px 140px;
  border-color: transparent;
  box-shadow: var(--dsh-lg-edge);
}
/* Third-party controls (dropdown triggers, appearance cards, settings nav):
   replace the control's own fill with translucent glass so the shared
   backdrop-filter frosts what is behind it, instead of covering it with an
   opaque fill. Selected/active states (aria-pressed / aria-current) and hover
   keep a stronger translucent fill so they stay distinguishable. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_selector"],
  [class*="_stepper"],
  [class*="_themeCube"],
  [class*="_navCell"],
  [class*="_arrow"]
) {
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise);
  background-size: 140px 140px;
  box-shadow: var(--dsh-lg-lift), var(--dsh-lg-edge);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_themeCube"][aria-pressed="true"],
  [class*="_navCell"][aria-current="true"]
) {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 88%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_themeCube"]:hover:not([aria-pressed="true"]),
  [class*="_navCell"]:hover:not([aria-current="true"])
) {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 72%, transparent) !important;
}
/* The chat/trajectory switch stays plain: its option boxes are not capsules. */
/* Every small option/icon control keeps its glass capsule at rest, so the
   shell reads as one material instead of lighting up only on hover. Controls
   inside a merged capsule are excluded here and styled as capsule segments. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  button[class*="_iconButton"],
  button[class*="_searchButton"],
  button[class*="_moreButton"],
  button[class*="_toggle"],
  button[class*="_newSession"],
  .dshDesktopTitlebarIconButton,
  [class*="dshMarketLauncher"],
  [class*="_0mJWUG_button"],
  [class*="triggerRow"] button
):not(:is(
  [class*="_headerUtilities"],
  [class*="_headerCorner"],
  [class*="_stripChrome"],
  [class*="_searchSlot"],
  [class*="_headerActions"]
) *) {
  border-radius: 10px;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: var(--dsh-lg-edge);
  transition: background-color 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  button[class*="_iconButton"],
  button[class*="_searchButton"],
  button[class*="_moreButton"],
  button[class*="_toggle"],
  button[class*="_newSession"],
  .dshDesktopTitlebarIconButton,
  [class*="dshMarketLauncher"],
  [class*="_0mJWUG_button"],
  [class*="triggerRow"] button
):not(:is(
  [class*="_headerUtilities"],
  [class*="_headerCorner"],
  [class*="_stripChrome"],
  [class*="_searchSlot"],
  [class*="_headerActions"]
) *):hover {
  background-color: color-mix(in srgb, #ffffff 13%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] button[class*="_newSession"] {
  border-color: color-mix(in srgb, #ffffff 14%, transparent) !important;
}
/* Adjacent option buttons merge into one capsule, split by hairline dividers.
   The groups are the chat header utilities, the rightbar strip, and the
   sidebar workspace header (search + view options + add). */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_headerUtilities"],
  [class*="_stripChrome"]:has(button),
  [class*="_searchSlot"]:has(button),
  [class*="_headerActions"]:has(button)
) {
  gap: 0 !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: var(--dsh-lg-edge);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_headerUtilities"] {
  border-radius: 10px !important;
}
/* The sidebar toggle stays its own control, next to the group rather than
   fused into it. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_headerCorner"] {
  border-radius: 10px !important;
  margin-left: 6px !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: var(--dsh-lg-edge) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_searchSlot"] {
  border-radius: 10px 0 0 10px !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_headerActions"]:has(button) {
  border-radius: 0 10px 10px 0 !important;
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 14%, transparent), var(--dsh-lg-edge) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_headerUtilities"],
  [class*="_headerCorner"],
  [class*="_stripChrome"],
  [class*="_searchSlot"],
  [class*="_headerActions"]:has(button)
) :is(button, [role="button"]) {
  border-radius: 0 !important;
  border-color: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_headerUtilities"],
  [class*="_headerCorner"],
  [class*="_stripChrome"],
  [class*="_searchSlot"],
  [class*="_headerActions"]:has(button)
) > * + *,
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [class*="_headerUtilities"],
  [class*="_headerCorner"],
  [class*="_stripChrome"],
  [class*="_searchSlot"],
  [class*="_headerActions"]:has(button)
) :is(button, [role="button"]) + :is(button, [role="button"]),
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_headerUtilities"] > div > span + span {
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 14%, transparent) !important;
}
/* The open-in-app split button is itself a segment inside the header capsule. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="XZ80vW_split"] {
  gap: 0 !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="XZ80vW_split"] > * + * {
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 14%, transparent) !important;
}
/* Composer tools: the add (+, attach) seats merge into one small capsule. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_add"] {
  border-radius: 0 !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: var(--dsh-lg-edge);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_add"]:first-of-type {
  border-radius: 10px 0 0 10px !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_add"]:last-of-type {
  border-radius: 0 10px 10px 0 !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_add"] + [class*="p_FcLG_add"] {
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 14%, transparent), var(--dsh-lg-edge);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_tools"] {
  gap: 0 !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_modes"] {
  margin-left: 12px;
}
/* When the composer row runs out of room the model selector folds to its icon
   and chevron, like the permission selector already does. Upstream waits until
   360px, which overflows first; fold it as soon as the trailing cluster is
   tight so the send button always stays in reach. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="p_FcLG_trailing"],
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="IecIca_root"],
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="IecIca_trigger"] {
  min-width: 0;
}
@container (width<=520px) {
  body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="IecIca_triggerLabel"],
  body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="IecIca_triggerEffort"] {
    display: none;
  }
  body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="IecIca_triggerIcon"] {
    display: block;
  }
}
/* The two header groups are siblings; close the gap so they read as one bar. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_titleRow"] {
  gap: 0 !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_titleCluster"] {
  margin-right: auto;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_sectionHeader"] {
  gap: 0 !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_sectionHeader"] > [class*="_sectionLabel"] {
  margin-right: auto;
}
/* Rail: the three launchers (new session, add workspace, search) stack into one
   vertical glass capsule. They live in different plugin roots, so close the
   margins between them and give each the right segment geometry. The brand
   toggle keeps its own rounded, separate capsule. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_collapsed"] button[class*="_toggle"],
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] button[class*="_toggle"] {
  border-radius: 10px !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_collapsed"] button[class*="_newSession"] {
  border-radius: 10px 10px 0 0 !important;
  margin-bottom: 0 !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: inset 0 1px 0 var(--dsh-lg-edge-light), inset 1px 0 0 var(--dsh-lg-edge-rim), inset -1px 0 0 var(--dsh-lg-edge-rim), inset 0 -1px 0 color-mix(in srgb, #ffffff 14%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] [class*="_sectionHeader"] {
  margin-bottom: 0 !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
/* The rail wraps the add and search seats in rounded, clipping boxes; that is
   what was rounding the add seat and turning the search seat into a circle,
   overriding the capsule segment geometry. Open the clips. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] > [class*="_search"] {
  border-radius: 0 !important;
  overflow: visible !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] [class*="_headerActions"] {
  display: contents !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] button[class*="_iconButton"]:not([class*="_toggle"]) {
  border-radius: 0 !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 14%, transparent), inset 1px 0 0 var(--dsh-lg-edge-rim), inset -1px 0 0 var(--dsh-lg-edge-rim), inset 0 -1px 0 color-mix(in srgb, #ffffff 14%, transparent) !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class*="_rail"] button[class*="_searchButton"] {
  border-radius: 0 0 10px 10px !important;
  margin-bottom: 0 !important;
  background-color: var(--dsh-lg-tint-control) !important;
  background-image: var(--dsh-lg-noise) !important;
  background-size: 140px 140px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, #ffffff 14%, transparent), inset 1px 0 0 var(--dsh-lg-edge-rim), inset -1px 0 0 var(--dsh-lg-edge-rim), inset 0 -1px 1px var(--dsh-lg-edge-shade) !important;
}
/* Text fields share the control glass. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  input:not([type="checkbox"]):not([type="radio"]),
  textarea
) {
  background-color: color-mix(in srgb, #ffffff 6%, transparent) !important;
  border-color: color-mix(in srgb, #ffffff 12%, transparent) !important;
}
/* Message actions (copy, good answer, bad answer, branch) and the usage/time
   readouts share one glass capsule, split into segments by hairlines. Only rows
   that carry the feedback pair get it, so single-action rows stay untouched. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) {
  gap: 0;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) :is(
  [class~="_8leB5q_action"],
  [class~="gDWXgG_action"],
  [class~="nCk46q_root"]
) {
  background-color: color-mix(in srgb, #ffffff 4%, transparent) !important;
  background-image: var(--dsh-lg-noise);
  background-size: 140px 140px;
  border-radius: 0;
  box-shadow: inset 0 1px 0 var(--dsh-lg-edge-light), inset 0 -1px 1px var(--dsh-lg-edge-shade);
}
/* Wider seats so the icons are not cramped. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) :is(
  [class~="_8leB5q_action"],
  [class~="gDWXgG_action"]
) {
  width: calc(36px + var(--dsh-content-font-delta, 0px));
}
/* Upstream pulls an adjacent readout left by 6px; inside the capsule that
   overlap hides the end of the usage text, so let the segments abut cleanly. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) [class~="nCk46q_root"] {
  margin-left: 0 !important;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) :is(
  [class~="gDWXgG_action"],
  [class~="nCk46q_root"]
),
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_action"]:not(:first-child) {
  box-shadow: inset 1px 0 0 color-mix(in srgb, #ffffff 12%, transparent), inset 0 1px 0 var(--dsh-lg-edge-light), inset 0 -1px 1px var(--dsh-lg-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_action"]:first-child {
  border-radius: 999px 0 0 999px;
  box-shadow: inset 1px 0 0 var(--dsh-lg-edge-rim), inset 0 1px 0 var(--dsh-lg-edge-light), inset 0 -1px 1px var(--dsh-lg-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) [class~="nCk46q_root"]:has(+ [class~="_8leB5q_timeEnd"]) {
  border-radius: 0 999px 999px 0;
  box-shadow: inset -1px 0 0 var(--dsh-lg-edge-rim), inset 1px 0 0 color-mix(in srgb, #ffffff 12%, transparent), inset 0 1px 0 var(--dsh-lg-edge-light), inset 0 -1px 1px var(--dsh-lg-edge-shade);
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) [class~="nCk46q_trigger"] {
  background-color: transparent !important;
  background-image: none;
  padding: 6px 12px;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [class~="_8leB5q_actions"]:has([class~="gDWXgG_action"]) > [class~="_8leB5q_timeEnd"] {
  margin-left: 10px;
}
/* Menus, listboxes, tooltips, and non-modal dialogs float on the popover glass. */
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
  background-color: transparent !important;
  background-image: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, #ffffff 26%, transparent);
  box-shadow: var(--dsh-lg-shadow);
  color: var(--dsw-alias-label-primary);
}
/* The frost (and the edge refraction) live on a ::before layer so the SVG
   displacement can bend the backdrop without distorting the menu text. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] :is(
  [role="menu"],
  [role="listbox"],
  [role="tooltip"],
  [role="dialog"]:not([aria-modal="true"]),
  .dshDesktopVersionPopover,
  .dshDesktopActionMenu,
  .dshDesktopSettingsMenu,
  .dshShadcnHoverCardContent
)::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-color: var(--dsh-lg-tint-popover);
  background-image: var(--dsh-lg-noise);
  background-size: 140px 140px;
  -webkit-backdrop-filter: var(--dsh-lg-blur-popover);
  backdrop-filter: var(--dsh-lg-blur-popover);
  filter: var(--dsh-lg-refract);
}
/* Settings and other modals: a deep frosted pane above the receded shell. */
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [aria-modal="true"] {
  background-color: transparent !important;
  background-image: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  isolation: isolate;
}
body[data-dsh-desktop-platform="linux"][data-dsh-desktop-material="transparent"] [aria-modal="true"]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--dsw-static-neutral-bluish-900) 42%, transparent), color-mix(in srgb, var(--dsw-static-neutral-bluish-950) 52%, transparent)), var(--dsh-lg-noise);
  background-size: 100% 100%, 140px 140px;
  -webkit-backdrop-filter: blur(48px) saturate(200%);
  backdrop-filter: blur(48px) saturate(200%);
  filter: var(--dsh-lg-refract);
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

/** Static 256x256 displacement map driving the Liquid Glass edge refraction. */
const GLASS_DISPLACEMENT_MAP = "data:image/jpeg;base64,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cUAUAkEkziomgGgkoxZGgxZFQFQlYnQHRdPfj/10KCSCKESCNiVkViPSLpD0h6I0Q0I0A2IoBWBIJIBKBIJoJIJ2R2J0JWBUJ0JUB0XTv479dFZDYiglYigkhEgjZFQjRFQjRFQjQigFYigHYigmgEgmglYlYnQlQlYlQHQlQnQ9P/kf1yVkNiNCNkNiVENiNiViNEViNkVCVgKCViViViSCViSCVgdCViVCViVCdgVCVCdD1D+U/XBWQ2I0I2Q2JUQ2I0JWQ0I2JUQ2JUI2JUI2J0JWJWJWA2R0BWJ0I2JUJ2BUJUJ0P//EABkQAQEBAQEBAAAAAAAAAAAAAAECABEDEP/aAAgBAQABAgB1atWrVq1atWrVq1atWrVq1atWrVq1atWrVq+OrVq1atWrVq1atWrVq1atWrVq1atWrVq1atXxVppppppdWrVq1atWrVq1NNNNNNNNNNNPVWmmmmms6tWrVq1atWpppppppppppppp6q0000uc51atWrVq1ammmmmmmmmmmmmt1Vpppc5znVq1atWrVqaaaaaaaaaaaaaeqtNLnOc51atWrVq1ammmmmmmmmmmmmnqrS5znOc6tWrVq16222mmmmmmlVppp6tKuc5znOrVq1a9TbbbbTTTTTSq000qtLnOc5zq1atWrW0222200000qqqtKqrnOc5zq1atTbbbbbbbbTTTSqqqqqq5znOc6tTTTbbbbbbbbTTTSqqqqrlVznOctNNNtttttttttNNNNKqqqrqznKqrTTTTbbbbbbbbbTTTSqqqqrqznOc5aaaabbbbbbbbbaaaaVVVVVdWc5znVq1NNttttttttttNNKqqqqudWc5znVq16tbbbbbbbbbbTTSqqqq5XVnOc6tWrVrb1tttttttttNNKqqqqrWrK5VWmmm2230bbbbbbaaaXOc5zlVa1KuVVppptttt9G22222mmlzlVznK6tWVVWmmmm2222222222mlznOc5znLWppVVWmmm22222229bTWrOc5znOcq1qaaVpWmm222222229erVqznOc5znKtatStK0rTbTTbbbberXr1as5znOc5aVpppppWlabaabbbb1ta9WrVnOc5znU0rTTTTTTTTTbTTbbbTWvVq1as5znOdTTStNNNNNNNNNtNNtttN6tWvVq1ZznOrU00rTTTTTTTTTTTTTbTWvVq1atWrOc6tTTTStNNNNNNNNNNtNNtNa9WrVq1Z1Z1NNNNNK1q1NNNNNNNNNNNtNatWrVq1atWrU00000rWrVq1atWrVq1alaaa1atWrVq1NNNammmmla1atWrVq1aterVq16tWrVnVqa1NK1qaaaVX/xAAWEAADAAAAAAAAAAAAAAAAAAAhgJD/2gAIAQEAAz8AaExf/8QAGhEBAQEBAQEBAAAAAAAAAAAAAQISEQADEP/aAAgBAgEBAgDx48ePHjx48ePHjx48ePHjx48ePHjx48ePHj86IiIiIiInjx48ePHjx48IiIiIj0oooooooooRERER73ve60UUUUUUVrWiiiiiihERERER73ve97ooooorRWiiiiihKERERER73ve973RRRRWtFFFFFFCIiIiIiPe973ve60UUVrRRRRRRQiIlCIiI973ve973pRRWiiiiiiiiiiiiiiihEe973ve973RRWtFFFFFFFFFFFFFFFFFFa13ve973WitaKKKKKKKKKKKKKKKKKK1rWtd1rutFa1oooooooooooosssooorWta1rWta1rRRRRRRRRRRZZZZZZZZZWta1rWta1rRRRRRRRRZZZZZZZZZZZZe9a1rWta1rWitaKLLLLLLLLLLLLLLLLL3rWta1rWtFbLLLLLLLLLLLLLLLLLLLL3vWta1rWita1ssssssss+hZZZZZZZZe961rWta0Vre97LLLLLLLLLLLPoWWWWWXrWta1oorWta3ssss+hZZZZ9Cyyyyyyyyiita1orWta1ve9llllllllllllllllFFa0VorWta1ve9llllllllllllllllllFFFaK1rWta1rWiyyyyyyyyyyyyiiiiiiitFFa1rWta1oosoosssssoooosoooorRRRWta1rWta0UUUUUWUUUUUUUUUUUVoooorWta1rWtaKKKKKKmiiiiiiiiiiiiiiitd73ve61oSiiipoqaKKKKKKKKKK0UUUVrve973vREREZoSihEooooorRRRRWtd73ve9EREREREoSiiiiitFllllla73ve9ERERERESiiiiiitH0PoWWWWVrXe96IiIiMoiJRRRRRRWjwlFFllllFFd6IiIiIlCUUUUUUUUUePHjx48ePCIiIiIiIiUUUUUUUUUUUePHjx48ePHjx48ePHjx48IiUUUUUUJRRRX//xAAWEQADAAAAAAAAAAAAAAAAAAABYJD/2gAIAQIBAz8AtEV7/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAECEP/aAAgBAwEBAgCtNNNNNNNNNNNNNNNNNNNNNNNNNNNNNcrTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXKrTTTTTTTU000000000000000000001FVpppppqampqaaaaaaaaaaaaaaaaaaaa5Vaaaaampqampqammmmmmmmmmmlaaaaaaiq0001NTU1NTU1NTTTTTTTTTTSqqtNNNcqtNNSyzU1LNTU1NTTTTTTTTTSqqq001ytNLLLLNTU1NTU1NTbbbTTTTTSqqq001ytNLLLLLNTU1NTU3NttttNNNNNKqq001KrSyyyyyzU1NTU3Nzc02220000qqqqrSqqyyyyyzU1NTU3Nzc3NttttNNNKqqqqqqssssss1NTU3Nzc3NzbbbbTTTSqqqqqqrLLLLLNTU1Nzc3Nzc22220000qqqqqqqqssss1NTU3Nzc3NzbbbbbTTSqqqqqqqqqqzU1NTc3Nzc3Nzbc22000qqqqqqqqqqqtTU3Nzc3Nzc3NtzbTTSqqqqrKqqqqqtNNzc23Nzc3Nzc3NTU1KqqqrKqqqqqtNNNNttzc3Nzc3NzU1NLLLLLKqqqqqqqq0022223Nzc3NzU1NSyyyyyyqqqqqqqrTTbbbbc3Nzc3NTU1LLLLLLKsqqqqqqrTTTTbbbc3Nzc1NTUsssssssqqqqqqrTTTTTbbbTc3NTU1NTUsssssqqqqqqqq0000222023NTU1NTUsssssqqqqqqqq000000003NTU1NTU1LLLLLNKrTSqqqqtNNNNNNtNNTU1NSzUssss00qq0qqqqrTTTTTTTTTU1NTUs1LLLNNNKrTTTSqqq00000000001NTU1LNTU0000qtNNNKqqqtNNNNNNNNTU1NTUs1NNNNNKss1NNNK00qtK0000001NNTU0s000000qq000001NKrStNNNNK1NNNNStNNNNNKqtNNNNNNNK0000000rU0000rTTTTTSq00000rTTTTTTTTTTTTTTTTStNNNNKr/xAAUEQEAAAAAAAAAAAAAAAAAAACg/9oACAEDAQM/AAAf/9k="

/**
 * SVG refraction filter: an edge-only displacement with the centre kept sharp.
 * Adapted from rdev/liquid-glass-react (MIT). The chromatic-aberration channel
 * split is dropped: over the dark shell it read as a coloured red/green border
 * rather than refraction, so this keeps a single displaced edge instead.
 */
function glassRefractionSvg(): string {
  const displacement = -42
  return `<svg width="0" height="0" style="position:absolute;left:-9999px;top:-9999px" aria-hidden="true"><defs>
  <filter id="dsh-lg-refract" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feImage x="0" y="0" width="100%" height="100%" result="MAP" href="${GLASS_DISPLACEMENT_MAP}" preserveAspectRatio="none"/>
    <feColorMatrix in="MAP" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="EDGE"/>
    <feComponentTransfer in="EDGE" result="MASK"><feFuncA type="table" tableValues="0 0.35 1"/></feComponentTransfer>
    <feDisplacementMap in="SourceGraphic" in2="MAP" scale="${displacement}" xChannelSelector="R" yChannelSelector="B" result="BENT"/>
    <feComposite in="BENT" in2="MASK" operator="in" result="EDGE_BENT"/>
    <feComponentTransfer in="MASK" result="INV"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>
    <feComposite in="SourceGraphic" in2="INV" operator="in" result="CENTER"/>
    <feComposite in="EDGE_BENT" in2="CENTER" operator="over"/>
  </filter>
</defs></svg>`
}

/** Install shared panel styles; mode selectors keep enhanced and extended chrome independent. */
export function installDesktopOwnedStyles(): () => void {
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-plugin-desktop'
  style.dataset.pluginCss = 'dsh-plugin-desktop/desktop-owned-layout'
  style.textContent = DESKTOP_OWNED_STYLES
  document.head.appendChild(style)
  // The refraction CSS references #dsh-lg-refract; install the filter together
  // with the sheet so the reference is never dangling (an invalid filter url
  // would drop the element from the render tree).
  const removeFilter = installGlassRefractionFilter()
  return () => { style.remove(); removeFilter() }
}

/**
 * Add the document-level SVG refraction filter. Guarded so the client unit
 * tests' minimal document doubles (no body or no element methods) stay no-ops.
 */
export function installGlassRefractionFilter(): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {}
  if (typeof document.body.appendChild !== 'function') return () => {}
  const host = document.createElement('div')
  if (typeof host.setAttribute !== 'function') return () => {}
  host.id = 'dsh-lg-refract-host'
  host.setAttribute('aria-hidden', 'true')
  if (host.style !== undefined) {
    host.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden'
  }
  host.innerHTML = glassRefractionSvg()
  document.body.appendChild(host)
  return () => { host.remove() }
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
