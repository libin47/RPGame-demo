// config/maps.ts
import type { GameMap, MapRegistry } from '../types/map'

const mainIsland: GameMap = {
  id: 'main_island',
  name: '主岛',
  backgroundImageId: 'map_main_island',
  nodes: [
    {
      id: 'node_beach',
      sceneId: 'beach',
      position: { x: 350, y: 500 },
      displayName: '海滩',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_beach',
      isInitiallyVisible: true,
      isInitiallyExplored: true,
    },
    {
      id: 'node_forest',
      sceneId: 'forest',
      position: { x: 400, y: 300 },
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
      position: { x: 200, y: 250 },
      displayName: '遗迹',
      unexploredIconId: 'map_icon_question',
      exploredIconId: 'map_icon_ruins',
      isInitiallyVisible: false,
      isInitiallyExplored: false,
    },
  ],
}

export const mapRegistry: MapRegistry = {
  maps: {
    main_island: mainIsland,
  },
  initialMapId: 'main_island',
  initialNodeId: 'node_beach',
}