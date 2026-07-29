// config/params.ts
import type { Param, ParamRegistry } from '../types/param'



const firstTimeOnBeach: Param = {
  id: 'first_time_on_beach',
  name: '首次到达海滩',
  defaultValue: 0,
}


export const paramRegistry: ParamRegistry = {
  params: {
    first_time_on_beach: firstTimeOnBeach,
  },
}
