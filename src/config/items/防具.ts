// 防具物品配置
import type { ArmorItem } from '@/types/item'
import { ItemCategory, ItemRarity, EquipmentSlot } from '@/types/item'

/** 薄外套 */
const 薄外套: ArmorItem = {
  id: '薄外套',
  name: '薄外套',
  description: '一件薄薄的户外夹克，虽然不厚实但能挡挡风。',
  category: ItemCategory.ARMOR,
  iconId: 'icon_jacket',
  weight: 0.8,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  durability: {
    maxDurability: 30,
    initialDurability: 25,
    isRepairable: true,
    repairMaterials: [{ itemId: '布料碎片', quantity: 2 }],
    repairWorkbenchLevel: 0,
    destroyOnBreak: false,
  },
  equipmentSlot: EquipmentSlot.BODY,
  defenseStats: {
    slashDefense: 1,
    bluntDefense: 1,
    rangedDefense: 0,
    poisonDefense: 0,
    fireDefense: 0,
  },
  attributeModifiers: [],
  temperatureResistance: {
    lowModifier: 3,
    highModifier: 0,
  },
  tags: ['armor', 'cloth', 'light'],
}

export { 薄外套 }
