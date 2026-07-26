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
import { 薄外套 } from './items/防具'
import { 镜子, 防水布, 尼龙绳 } from './items/材料'
import { 压缩饼干, 矿泉水, 止痛药, 消毒酒精, 绷带, 信号弹 } from './items/消耗品'
import { 多功能战术刀 } from './items/工具'
import { 笔记本 } from './items/文档'


export const itemRegistry: ItemRegistry = {
  items: {
    // 新物品（中文ID）
    薄外套,
    镜子,
    防水布,
    尼龙绳,
    压缩饼干,
    矿泉水,
    止痛药,
    消毒酒精,
    绷带,
    信号弹,
    多功能战术刀,
    笔记本,
  },
}
