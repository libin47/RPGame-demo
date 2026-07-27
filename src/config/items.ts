// config/items.ts
import type {
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  MaterialItem,
  ValuableItem,
  DocumentItem,
  RecipeItem,
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
import * as toolItems from './items/工具'
import * as documentItems from './items/文档'

export const itemRegistry: ItemRegistry = {
  items: {
    // 新物品（中文ID）
    ...armorItems,
    ...materialItems,
    ...consumableItems,
    ...toolItems,
    ...documentItems,
  },
}
