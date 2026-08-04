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
      isInitiallyVisible: true,
      isInitiallyExplored: true,
    },
    {
      id: 'node_forest',
      sceneId: 'forest',
      position: { x: 736, y: 1142 },
      displayName: '森林',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_forest',
      isInitiallyVisible: true,
      isInitiallyExplored: false,
    },
    {
      id: 'node_mountain',
      sceneId: 'mountain',
      position: { x: 600, y: 200 },
      displayName: '山区',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_mountain',
      isInitiallyVisible: true,
      isInitiallyExplored: false,
    },
    {
      id: 'node_ruins',
      sceneId: 'ruins',
      position: { x: 465, y: 342 },
      displayName: '遗迹',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_ruins',
      isInitiallyVisible: false,
      isInitiallyExplored: false,
    },
  ],
  // 节点间移动路径：移动沿路径逐段累计耗时/体力
  // （可选 condition 限制通行，如渡海需要船；oneWay 可配置单向路径）
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
