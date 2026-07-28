// 工具物品配置
import type { ToolItem } from '@/types/item'
import { ItemCategory, ItemRarity } from '@/types/item'
import type { MaterialItem } from '@/types/item'

/** 多功能战术刀 */
const 多功能战术刀: ToolItem = {
  id: '多功能战术刀',
  name: '多功能战术刀',
  description: '一把集成了刀刃、锯子、开瓶器、打火棒等多种功能的战术刀，野外生存利器。',
  category: ItemCategory.TOOL,
  iconId: 'icon_multitool_knife',
  weight: 0.4,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 30,
  isKeyItem: false,
  durability: {
    maxDurability: 80,
    initialDurability: 80,
    isRepairable: true,
    repairMaterials: [{ itemId: '铁片', quantity: 1 }],
    repairWorkbenchLevel: 1,
    destroyOnBreak: false,
    brokenItemId: '损坏的多功能战术刀',
  },
  toolTypeId: 'multitool',
  toolLevel: 2,
  tags: ['tool', 'knife', 'multitool', 'survival'],
}

/** 木竿 */
const 木竿: ToolItem = {
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
  toolTypeId: 'pole',
  toolLevel: 1,
  tags: ['tool', 'wood', 'pole'],
}

/** 石斧 */
const 石斧: ToolItem = {
  id: '石斧',
  name: '石斧',
  description: '用石头和木头绑成的简易斧头，虽然粗糙但足以砍伐小树和劈柴。',
  category: ItemCategory.TOOL,
  iconId: 'icon_stone_axe',
  weight: 1.0,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 12,
  isKeyItem: false,
  durability: {
    maxDurability: 30,
    initialDurability: 30,
    isRepairable: false,
    destroyOnBreak: true,
  },
  toolTypeId: 'axe',
  toolLevel: 1,
  tags: ['tool', 'axe', 'stone', 'handmade'],
}

/** 木矛 */
const 木矛: ToolItem = {
  id: '木矛',
  name: '木矛',
  description: '将木头一端削尖制成的简易长矛，可以用来捕鱼或防身。',
  category: ItemCategory.TOOL,
  iconId: 'icon_wooden_spear',
  weight: 0.8,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  durability: {
    maxDurability: 20,
    initialDurability: 20,
    isRepairable: false,
    destroyOnBreak: true,
  },
  toolTypeId: 'spear',
  toolLevel: 1,
  tags: ['tool', 'spear', 'wood', 'handmade'],
}

/** 石刀 */
const 石刀: ToolItem = {
  id: '石刀',
  name: '石刀',
  description: '用锋利的石片和布条绑成的简易切割工具，处理食材和割断绳索都很有用。',
  category: ItemCategory.TOOL,
  iconId: 'icon_stone_knife',
  weight: 0.3,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  durability: {
    maxDurability: 15,
    initialDurability: 15,
    isRepairable: false,
    destroyOnBreak: true,
  },
  toolTypeId: 'knife',
  toolLevel: 1,
  tags: ['tool', 'knife', 'stone', 'handmade'],
}

/** 简易鱼竿 */
const 简易鱼竿: ToolItem = {
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
  durability: {
    maxDurability: 25,
    initialDurability: 25,
    isRepairable: true,
    repairMaterials: [{ itemId: '尼龙绳', quantity: 1 }],
    repairWorkbenchLevel: 0,
    destroyOnBreak: true,
  },
  toolTypeId: 'fishingRod',
  toolLevel: 1,
  tags: ['tool', 'fishing', 'handmade', 'wood'],
}

export { 多功能战术刀, 木竿, 石斧, 木矛, 石刀, 简易鱼竿 }
