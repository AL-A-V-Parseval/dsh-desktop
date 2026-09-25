/** Publish the native platform before the official Web UI renders its menus. */
export function markDocumentPlatform(doc: Document, platform: NodeJS.Platform): void {
  const mark = (): void => { doc.documentElement.dataset.platform = platform }
  // Electron may run the preload before the document root exists.
  if (doc.documentElement === null) doc.addEventListener('DOMContentLoaded', mark, { once: true })
  else mark()
}
