// 材料物品配置
import type { MaterialItem } from '@/types/item'
import { ItemCategory, ItemRarity } from '@/types/item'

/** 镜子 */
const 镜子: MaterialItem = {
  id: '镜子',
  name: '镜子',
  description: '一面巴掌大的镜子，边框已经有些生锈了。可以用来反射光线。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_mirror',
  weight: 0.3,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 5,
  isKeyItem: false,
  tags: ['material', 'glass', 'reflective'],
}

/** 防水布 */
const 防水布: MaterialItem = {
  id: '防水布',
  name: '防水布',
  description: '一块结实的防水布，可以用来搭建临时庇护所或包裹物品。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_tarp',
  weight: 0.6,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  tags: ['material', 'cloth', 'waterproof'],
}

/** 尼龙绳 */
const 尼龙绳: MaterialItem = {
  id: '尼龙绳',
  name: '尼龙绳',
  description: '一根长约十米的尼龙绳，非常结实，是野外生存的必备品。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_nylon_rope',
  weight: 0.5,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 6,
  isKeyItem: false,
  tags: ['material', 'rope', 'nylon'],
}
/** 木头 */
const 木头: MaterialItem = {
  id: '木头',
  name: '木头',
  description: '一截木头。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_log',
  weight: 0.5,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 6,
  isKeyItem: false,
  tags: ['material', 'wood'],
}

/** 金属碎片 */
const 金属碎片: MaterialItem = {
  id: '金属碎片',
  name: '金属碎片',
  description: '一块金属碎片，可以用来修复或制作工具。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_metal_fragment',
  weight: 0.1,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 2,
  isKeyItem: false,
  tags: ['material', 'metal', 'fragment'],
}

/** 布料 */
const 布料: MaterialItem = {
  id: '布料',
  name: '布料',
  description: '一块裁剪过的布料碎片，适合修补衣物或制作简易绷带。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_cloth',
  weight: 0.2,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  tags: ['material', 'cloth'],
}

/** 石头 */
const 石头: MaterialItem = {
  id: '石头',
  name: '石头',
  description: '一块石头。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_stone',
  weight: 0.2,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  tags: ['material', 'stone'],
}
/** 贝壳 */
const 贝壳: MaterialItem = {
  id: '贝壳',
  name: '贝壳',
  description: '一块贝壳。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_shell',
  weight: 0.1,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  tags: ['material', 'stone'],
}
/** 燧石 */
const 燧石: MaterialItem = {
  id: '燧石',
  name: '燧石',
  description: '一块燧石。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_firestone',
  weight: 0.1,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  tags: ['material', 'stone'],
}
/** 发光藻类 */
const 发光藻类: MaterialItem = {
  id: '发光藻类',
  name: '发光藻类',
  description: '一块发光藻类，发光原理暂未确定。',
  category: ItemCategory.MATERIAL,
  iconId: 'icon_glowing_algae',
  weight: 0.1,
  maxStackSize: -1,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  tags: ['material', 'algae', 'glow'],
}

export { 镜子, 防水布, 尼龙绳, 木头, 金属碎片, 石头, 布料, 贝壳, 燧石, 发光藻类 }
