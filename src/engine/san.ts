import type { PlayerState, UiState } from '@/types/state'

export interface SanTheme {
  filter: string
  accent: string
  narrativeOpacity: number
  glitch: boolean
}

export function sanTheme(san: number): SanTheme {
  if (san <= 15) {
    return {
      filter: 'hue-rotate(-25deg) contrast(1.15) saturate(0.7)',
      accent: '#6b2b2b',
      narrativeOpacity: 0.92,
      glitch: true,
    }
  }
  if (san <= 35) {
    return {
      filter: 'saturate(0.85) brightness(0.95)',
      accent: '#4a3a28',
      narrativeOpacity: 0.96,
      glitch: false,
    }
  }
  return {
    filter: 'none',
    accent: '#2a4a3a',
    narrativeOpacity: 1,
    glitch: false,
  }
}

/** Intelligence makes SAN drop easier but also recover more. */
export function scaleSanDelta(player: PlayerState, delta: number): number {
  const int = player.attrs.intelligence
  if (delta < 0) {
    return delta * (1 + (int - 10) * 0.03)
  }
  return delta * (1 + (int - 10) * 0.04)
}

export function applySan(player: PlayerState, delta: number): string[] {
  const scaled = scaleSanDelta(player, delta)
  const before = player.survival.san
  player.survival.san = Math.max(0, Math.min(player.survivalMax.san, before + scaled))
  const texts: string[] = []
  if (scaled < -5) texts.push('理智摇摇欲坠……')
  if (scaled > 5) texts.push('你感觉头脑清醒了一些。')
  return texts
}

export function maybeUncontrolledAction(player: PlayerState): string | null {
  if (player.survival.san > 20) return null
  if (Math.random() > 0.15) return null
  if (player.survival.san <= 10) {
    return '一阵无法控制的冲动掠过你：你对着空气低语，直到声音自己停下。'
  }
  return '你的手指不听使唤地抠着地面，指甲缝里嵌进了沙粒。'
}

export function applySanUiHints(ui: UiState, san: number): void {
  // Reserved for future forced narrative injection via ui queue
  void ui
  void san
}
