// config/items.ts
import type {
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  MaterialItem,
  DocumentItem,
  MiscItem,
  ItemRegistry,
} from '../types/item'
import { ItemCategory, ItemRarity, EquipmentSlot, ConsumableType } from '../types/item'
import { RecipeType } from '../types/recipe'
import { EffectType, AttributeType, AttributeOperation } from '../types/effect'

// 导入分类物品
import * as armorItems from './items/防具'
import * as materialItems from './items/材料'
import * as consumableItems from './items/消耗品'
import * as weaponItems from './items/武器'
import * as itemItems from './items/物品'
import * as documentItems from './items/文档'

export const itemRegistry: ItemRegistry = {
  items: {
    // 新物品（中文ID）
    ...armorItems,
    ...materialItems,
    ...consumableItems,
    ...weaponItems,
    ...itemItems,
    ...documentItems,
  },
}
