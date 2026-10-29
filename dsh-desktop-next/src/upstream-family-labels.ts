/**
 * Official names that differ between the DSH releases Next and Beta follow. Like
 * src/upstream-family.ts, this file is a declared difference between the variants
 * (scripts/verify-desktop-variants.mjs); it stays free of imports because renderer bundles use it.
 */

/** How the official `@deepseek-ai/dsh-experimental-plugin-market-bundle` presents itself in its locale files. */
export const OFFICIAL_PLUGIN_INDEX = {
  title: { zh: '自定义插件市场', en: 'Custom plugin markets' },
  description: {
    zh: '在插件页添加「发现」标签页，从你添加的插件市场索引浏览和安装插件。',
    en: 'Adds a Discover tab to Plugins for browsing and installing bundles from plugin market indexes you add',
  },
} as const
