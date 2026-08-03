// 基础物品配置（BaseItem：不属于武器/防具/消耗品/材料/文档/杂项的其他物品）
import type { Item } from '@/types/item'
import { ItemCategory } from '@/types/item'

/** 木竿 */
const 木竿: Item = {
  id: '木竿',
  name: '木竿',
  description: '木头做的长竿，可以用来够取远处的东西或作为简易武器的握柄。',
  category: ItemCategory.TOOL,
  iconId: 'icon_log',
  weight: 0.4,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 30,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'pole',
    toolLevel: 1,
  },
  tags: ['tool', 'wood', 'pole'],
}

/** 简易鱼竿 */
const 简易鱼竿: Item = {
  id: '简易鱼竿',
  name: '简易鱼竿',
  description: '用木竿和尼龙绳绑成的简易鱼竿，虽然简陋但足够在岸边钓鱼。',
  category: ItemCategory.TOOL,
  iconId: 'icon_fishing_rod',
  weight: 0.6,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 15,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'fishingRod',
    toolLevel: 1,
  },
  tags: ['tool', 'fishing', 'handmade', 'wood'],
}

export { 木竿, 简易鱼竿 }
