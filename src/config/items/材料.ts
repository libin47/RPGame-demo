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

export { 镜子, 防水布, 尼龙绳 }