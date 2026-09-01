// 文档物品配置
import type { DocumentItem } from '@/types/item'
import { ItemCategory, ItemRarity } from '@/types/item'

/** 笔记本 */
const 笔记本: DocumentItem = {
  id: '笔记本',
  name: '笔记本',
  description: '一本笔记本，记录着你漂泊以来的见闻。',
  category: ItemCategory.DOCUMENT,
  iconId: 'icon_notebook',
  weight: 0.3,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  isDiary: true,
  onReadEffects: [],
  isConsumedOnRead: false,
  tags: ['document', 'notebook', 'lore'],
}

export { 笔记本 }
