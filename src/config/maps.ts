// config/maps.ts
import type { GameMap, MapRegistry } from '../types/map'

const mainIsland: GameMap = {
  id: 'main_island',
  name: '主岛',
  backgroundImageId: 'map.png',
  nodes: [
    {
      id: 'node_beach',
      sceneId: 'beach',
      position: { x: 850, y: 1250 },
      displayName: '海滩',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_beach',
    },
    {
      id: 'node_forest',
      sceneId: 'forest',
      position: { x: 736, y: 1142 },
      displayName: '森林',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_forest',
    },
    {
      id: 'node_mountain',
      sceneId: 'mountain',
      position: { x: 600, y: 200 },
      displayName: '山区',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_mountain',
    },
    {
      id: 'node_ruins',
      sceneId: 'ruins',
      position: { x: 465, y: 342 },
      displayName: '遗迹',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_ruins',
      // 节点解锁条件（与 MapPath.condition 同类型）：满足前节点不可见、不可前往
      // 解锁方式：事件结果里配置 flag 效果 { type: 'flag', flagId: 'ruins_unlocked', operation: 'set', value: true }
      condition: { flag: ['ruins_unlocked'] },
    },
  ],
  // 节点间移动路径：移动沿路径逐段累计耗时/体力
  // （可选 condition 限制通行，如渡海需要船；oneWay 可配置单向路径）
  // 注意：节点解锁后但路径不可达（如本条 condition 未满足）时，节点仍可见、但不能从大地图移动过去（仍可通过事件移动）
  paths: [
    { from: 'node_beach', to: 'node_forest', travelMinutes: 20, staminaCost: 5 },
    { from: 'node_forest', to: 'node_mountain', travelMinutes: 90, staminaCost: 15 },
    { from: 'node_mountain', to: 'node_ruins', travelMinutes: 25, staminaCost: 8 },
  ],
}

export const mapRegistry: MapRegistry = {
  maps: {
    main_island: mainIsland,
  },
  initialMapId: 'main_island',
  initialNodeId: 'node_beach',
}
