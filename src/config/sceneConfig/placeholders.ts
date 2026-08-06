// sceneConfig/placeholders.ts
// 大地图占位测试场景（森林/山区/遗迹，用于大地图移动测试）

import type { Scene } from '../../types/scene'
import { exploreButton, moveButton } from './shared'

const forest: Scene = {
  id: 'forest',
  name: '森林',
  descriptions: [
    {
      id: 'forest_1',
      priority: 10,
      text: '你走进森林。光线从层层叠叠的树冠缝隙间漏下来，在地面上投下斑驳的光影。\n空气中弥漫着潮湿的泥土和腐殖质的味道。远处有鸟鸣，也有细碎的不明声响。\n这里暂时是安全的，但你总觉得有什么在暗处注视着你。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [moveButton],
  temperatureModifier: -2,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

const mountain: Scene = {
  id: 'mountain',
  name: '山区',
  descriptions: [
    {
      id: 'mountain_1',
      priority: 10,
      text: '山路陡峭，碎石在脚下滚动。\n风很大，吹得你几乎站不稳。从这里可以俯瞰整座岛的轮廓——一片被蓝海包围的绿色陆地。\n岩缝里或许藏着有用的东西。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [moveButton],
  temperatureModifier: -5,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

const ruins: Scene = {
  id: 'ruins',
  name: '遗迹',
  descriptions: [
    {
      id: 'ruins_1',
      priority: 10,
      text: '残破的石柱歪斜地立在荒草之中，像某种古老文明的墓碑。\n墙壁上刻着看不懂的符号，在夕阳下泛着暗红的光。\n这里的空气很安静——安静得不太正常。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [moveButton],
  temperatureModifier: 0,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

export { forest, mountain, ruins }
