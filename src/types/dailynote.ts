// reading.ts - 阅读数据结构
import type { Condition, Conditions } from './effect'

export interface DailyNoteConfig {
  id: string
  content: {
    conditions?: Conditions
    content: string
    image?: string
  }[]
}

export interface DailyNoteRegistry {
  dailyNotes: Record<string, DailyNoteConfig>
}

/** 日记条目 · 一天一页 */
export interface DiaryEntry {
  /** 记录当天（游戏内天数） */
  day: number
  /** 当天写入的内容 */
  text: string
}
