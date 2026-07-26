// 文档物品配置
import type { DocumentItem } from '@/types/item'
import { ItemCategory, ItemRarity } from '@/types/item'

/** 笔记本 */
const 笔记本: DocumentItem = {
  id: '笔记本',
  name: '笔记本',
  description: '一本笔记本。',
  category: ItemCategory.DOCUMENT,
  iconId: 'icon_notebook',
  weight: 0.3,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  content:
    '你可以用它写点儿东西。',
  onReadEffects: [],
  isConsumedOnRead: false,
  author: '未知研究者',
  tags: ['document', 'notebook', 'lore'],
}

export { 笔记本 }