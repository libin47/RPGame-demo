// 基础物品配置（BaseItem：不属于武器/防具/消耗品/材料/文档/杂项的其他物品）
import type { MiscItem } from '@/types/item'
import { ItemCategory } from '@/types/item'

/** 金属铭牌 */
const 金属铭牌: MiscItem = {
  id: '金属铭牌',
  name: '金属铭牌',
  description: '一个金属的铭牌，上面写着\n\n姓名：J.SuperL\nSite：829\nLevel：C\n血型：A Rh+\n',
  category: ItemCategory.MISC,
  iconId: 'icon_nameplate',
  weight: 0,
  maxStackSize: 1,
  isSellable: false,
  tags: ['nameplate'],
  isKeyItem: true,
}

/** 手绘地图草稿 */
const 手绘地图草稿: MiscItem = {
  id: '手绘地图草稿',
  name: '手绘地图草稿',
  description: '一个简易的手绘地图草稿，在北边山脚下圈出来了一个位置。',
  category: ItemCategory.MISC,
  iconId: 'icon_map',
  weight: 0,
  maxStackSize: 1,
  isSellable: false,
  tags: ['map'],
  isKeyItem: true,
}
// 祭祀石板
const 祭祀石板: MiscItem = {
  id: '祭祀石板',
  name: '祭祀石板',
  description: '海岸哨岩上发现的祭祀石板，上面画着形状类似三个眼睛的符号。',
  category: ItemCategory.MISC,
  iconId: 'icon_nameplate',
  weight: 0,
  maxStackSize: 1,
  isSellable: false,
  tags: ['祭祀石板'],
  isKeyItem: true,
}

export { 金属铭牌, 手绘地图草稿, 祭祀石板 }
