// events.ts - 事件注册表装配层
// 各场景事件配置按场景拆分在 eventConfig/ 目录下，此文件仅负责汇总注册

import type { EventRegistry } from '../types/event'
import * as event_飞机残骸 from './eventConfig/飞机残骸'
import * as event_机翼营地 from './eventConfig/机翼营地'
import * as event_海滩 from './eventConfig/海滩'
import * as event_椰树林 from './eventConfig/椰树林'
import * as event_海岸哨岩 from './eventConfig/海岸哨岩'
import * as event_潮汐洞穴 from './eventConfig/潮汐洞穴'

export const eventRegistry: EventRegistry = {
  events: {
    ...event_飞机残骸,
    ...event_机翼营地,
    ...event_海滩,
    ...event_椰树林,
    ...event_海岸哨岩,
    ...event_潮汐洞穴,
  },
}
