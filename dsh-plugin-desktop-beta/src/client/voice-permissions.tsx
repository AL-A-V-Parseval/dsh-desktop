/** Native microphone access alongside the official voice bundle's enable switch. */
import type { Context } from '@deepseek-ai/cordis'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { DesktopPermissionsButton } from './permissions.tsx'
import { installDesktopPermissionsStyles } from './permissions-styles.ts'
import type {} from '../desktop-permissions-contract.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'desktop.voicePermissions': 'language'
  }
}

const VOICE_BUNDLE = '@deepseek-ai/dsh-experimental-voice-input-bundle'

export function registerVoicePermissions(ctx: Context): void {
  ctx.effect(() => ctx.locale.register('desktop.voicePermissions', { zh: { language: 'zh' }, en: { language: 'en' } }), 'Desktop voice permission labels')
  ctx.effect(installDesktopPermissionsStyles, 'Desktop permission dialog styles')
  ctx.slots.inject('plugins.bundle.actions', () => ctx.slots.register({
    name: 'plugins.bundle.actions', key: VOICE_BUNDLE, locale: 'desktop.voicePermissions',
  }, VoicePermissionsAction))
  ctx.slots.inject('plugins.detail.actions', () => ctx.slots.register({
    name: 'plugins.detail.actions', id: 'desktop-voice-permissions', locale: 'desktop.voicePermissions',
  }, VoicePermissionsAction))
}

export function VoicePermissionsAction({ t, subject }: PropsLocale<'desktop.voicePermissions'> & PropsRuntime<'plugins.detail.actions'>) {
  if (subject.kind !== 'bundle' || subject.pkg.name !== VOICE_BUNDLE || !window.dshDesktopPermissions) return null
  const zh = t('language') === 'zh'
  return <DesktopPermissionsButton service={window.dshDesktopPermissions} language={zh ? 'zh' : 'en'}
    permission="microphone" label={zh ? '权限设置' : 'Permission settings'} />
}
