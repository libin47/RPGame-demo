// 武器物品配置
import type { WeaponItem } from '@/types/item'
import { ItemCategory, EquipmentSlot } from '@/types/item'

/** 石斧 */
const 石斧: WeaponItem = {
  id: '石斧',
  name: '石斧',
  description: '用石头和木头绑成的简易斧头，虽然粗糙但足以砍伐小树、劈柴，也能用来战斗。',
  category: ItemCategory.WEAPON,
  iconId: 'icon_stone_axe',
  weight: 1.0,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 12,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'axe',
    toolLevel: 1,
  },
  durability: {
    maxDurability: 30,
    initialDurability: 30,
    isRepairable: false,
    destroyOnBreak: true,
  },
  weaponTypeId: 'axe',
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 27,
    attackDistance: 1,
    damageTypeId: 'slash',
    damageVariance: 0.15,
    accuracyModifier: 0,
    criticalChanceModifier: 0,
    criticalMultiplier: 2.0,
  },
  tags: ['tool', 'axe', 'stone', 'handmade'],
}

/** 木矛 */
const 木矛: WeaponItem = {
  id: '木矛',
  name: '木矛',
  description: '将木头一端削尖制成的简易长矛，可以用来捕鱼，也是可靠的近战武器。',
  category: ItemCategory.WEAPON,
  iconId: 'icon_wooden_spear',
  weight: 0.8,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'spear',
    toolLevel: 1,
  },
  durability: {
    maxDurability: 20,
    initialDurability: 20,
    isRepairable: false,
    destroyOnBreak: true,
  },
  weaponTypeId: 'spear',
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 6,
    attackDistance: 2,
    damageTypeId: 'pierce',
    damageVariance: 0.2,
    accuracyModifier: 0,
    criticalChanceModifier: 0,
    criticalMultiplier: 2.0,
  },
  tags: ['tool', 'spear', 'wood', 'handmade'],
}

/** 石刀 */
const 石刀: WeaponItem = {
  id: '石刀',
  name: '石刀',
  description: '用锋利的石片和布条绑成的简易切割工具，处理食材、割断绳索，也能勉强用于近身防卫。',
  category: ItemCategory.WEAPON,
  iconId: 'icon_stone_knife',
  weight: 0.3,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'knife',
    toolLevel: 1,
  },
  durability: {
    maxDurability: 15,
    initialDurability: 15,
    isRepairable: false,
    destroyOnBreak: true,
  },
  weaponTypeId: 'knife',
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 5,
    attackDistance: 1,
    damageTypeId: 'slash',
    damageVariance: 0.1,
    accuracyModifier: 0.05,
    criticalChanceModifier: 0,
    criticalMultiplier: 2.0,
  },
  tags: ['tool', 'knife', 'stone', 'handmade'],
}

/** 多功能战术刀 */
const 多功能战术刀: WeaponItem = {
  id: '多功能战术刀',
  name: '多功能战术刀',
  description:
    '一把集成了刀刃、锯子、开瓶器、打火棒等多种功能的战术刀，野外生存利器，也足以作为近身武器。',
  category: ItemCategory.WEAPON,
  iconId: 'icon_multitool_knife',
  weight: 0.4,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 30,
  isKeyItem: false,
  toolCapabilities: {
    toolTypeId: 'multitool',
    toolLevel: 2,
  },
  durability: {
    maxDurability: 80,
    initialDurability: 80,
    isRepairable: true,
    repairMaterials: [{ itemId: '铁片', quantity: 1 }],
    repairWorkbenchLevel: 1,
    destroyOnBreak: false,
    brokenItemId: '损坏的多功能战术刀',
  },
  weaponTypeId: 'knife',
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 8,
    attackDistance: 1,
    damageTypeId: 'slash',
    damageVariance: 0.1,
    accuracyModifier: 0.05,
    criticalChanceModifier: 0.1,
    criticalMultiplier: 2.0,
  },
  tags: ['tool', 'knife', 'multitool', 'survival'],
}

export { 石斧, 木矛, 石刀, 多功能战术刀 }
