// reading.ts - 阅读数据结构
import type { Condition, Conditions } from './effect'

export interface ReadingConfig {
  id: string
  title: string // 显示标题
  author?: string // 作者，显示在标题下方
  sourceType: 'diary' | 'file' | 'terminal'

  pages: ReadingPage[] // 一页一条，可能只有一页
  currentPage?: number // 打开时定位到第几页，默认第一页，-1则最后一页
}

export interface ReadingPage {
  /** 单页标题（如日记的"第n日"）；不填则使用阅读整体标题 */
  title?: string
  content: string
  condition?: Condition
}

export interface ReadingRegistry {
  readings: Record<string, ReadingConfig>
}
