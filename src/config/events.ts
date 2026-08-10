// events.ts - 事件注册表装配层
// 各场景事件配置按场景拆分在 eventConfig/ 目录下，此文件仅负责汇总注册

import type { EventRegistry } from '../types/event'
import {
  event_beach_飞机残骸,
  event_飞机残骸_搜索座椅,
  event_飞机残骸_搜索行李架,
  event_飞机残骸_搜索夹缝,
  event_飞机残骸_搜索头等舱,
  event_飞机残骸_驾驶舱,
  event_飞机残骸_搜索残骸,
} from './eventConfig/飞机残骸'
import { event_机翼营地_搭建营地 } from './eventConfig/机翼营地'
import { event_beach_大螃蟹, event_beach_大海的馈赠 } from './eventConfig/海滩'
import {
  event_beach_椰树林_灰褐色的猴子,
  event_beach_椰树林_追踪猴群,
  event_beach_椰树林_猴王的领地,
  event_beach_椰树林_发现荒野,
  event_beach_椰树林_猴王攻击,
  event_beach_椰树林_击败猴王_未追踪,
} from './eventConfig/椰树林'
import * as event_海岸哨岩 from './eventConfig/海岸哨岩'
import * as event_潮汐洞穴 from './eventConfig/潮汐洞穴'

export const eventRegistry: EventRegistry = {
  events: {
    event_beach_飞机残骸,
    event_beach_大螃蟹,
    event_beach_大海的馈赠,

    event_飞机残骸_搜索座椅,
    event_飞机残骸_搜索夹缝,
    event_飞机残骸_搜索行李架,
    event_飞机残骸_搜索头等舱,
    event_飞机残骸_驾驶舱,
    event_飞机残骸_搜索残骸,

    event_机翼营地_搭建营地,

    event_beach_椰树林_发现荒野,
    event_beach_椰树林_追踪猴群,
    event_beach_椰树林_猴王的领地,
    event_beach_椰树林_灰褐色的猴子,
    event_beach_椰树林_猴王攻击,
    event_beach_椰树林_击败猴王_未追踪,
    ...event_海岸哨岩,
    ...event_潮汐洞穴,
  },
}
