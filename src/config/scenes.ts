// scenes.ts - 场景注册表装配层
// 各场景的具体配置按场景拆分在 sceneConfig/ 目录下，此文件仅负责汇总注册

import type { SceneRegistry } from '../types/scene'
import beach from './sceneConfig/beach'
import beach_飞机残骸 from './sceneConfig/beach_飞机残骸'
import beach_机翼营地 from './sceneConfig/beach_机翼营地'
import beach_椰树林 from './sceneConfig/beach_椰树林'
import beach_礁石区 from './sceneConfig/beach_礁石区'
import { forest, mountain, ruins } from './sceneConfig/placeholders'

export const sceneRegistry: SceneRegistry = {
  scenes: {
    beach,
    forest,
    mountain,
    ruins,
  },
  subScenes: {
    beach_飞机残骸,
    beach_机翼营地,
    beach_椰树林,
    beach_礁石区,
  },
  initialSceneId: 'beach',
}
