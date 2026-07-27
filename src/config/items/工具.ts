// 工具物品配置
import type { ToolItem } from '@/types/item'
import { ItemCategory, ItemRarity } from '@/types/item'

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
  description: '木头做的长竿。',
  category: ItemCategory.TOOL,
  iconId: 'icon_log',
  weight: 0.4,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 30,
  isKeyItem: false,
  toolTypeId: 'multitool',
  toolLevel: 2,
  tags: ['tool', 'wood', 'multitool', 'survival'],
}
export { 多功能战术刀, 木竿 }
