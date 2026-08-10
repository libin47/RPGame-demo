// config/params.ts
import type { Param, ParamRegistry } from '../types/param'

const beach_螃蟹: Param = {
  id: 'beach_螃蟹',
  defaultValue: 20,
  timeVarying: {
    mode: 'accumulate',
    recoveryPerDay: 1,
    min: 0,
    max: 20,
  },
}
const beach_飞机残骸_残骸: Param = {
  id: 'beach_飞机残骸_残骸',
  defaultValue: 5,
  timeVarying: {
    mode: 'accumulate',
    deltaPerDay: 2,
    min: 0,
    max: 10,
  },
}

const beach_椰子: Param = {
  id: 'beach_椰子',
  defaultValue: 20,
  timeVarying: {
    mode: 'accumulate',
    recoveryPerDay: 1,
    recoveryBaseId: 'beach_椰子树',
    min: 0,
    max: 20,
  },
}
const beach_椰子树: Param = {
  id: 'beach_椰子树',
  defaultValue: 20,
  timeVarying: {
    mode: 'accumulate',
    recoveryPerDay: 1,
    min: 0,
    max: 20,
  },
}
const beach_贝壳: Param = {
  id: 'beach_贝壳',
  defaultValue: 10,
  timeVarying: {
    mode: 'reset_daily',
    resetValue: 5,
    min: 0,
    max: 5,
  },
}
const beach_潮汐池: Param = {
  id: 'beach_潮汐池',
  defaultValue: 20,
  timeVarying: {
    mode: 'accumulate',
    deltaPerDay: 5,
    min: 0,
    max: 10,
  },
}
const beach_发光藻类: Param = {
  id: 'beach_发光藻类',
  defaultValue: 10,
  timeVarying: {
    mode: 'accumulate',
    deltaPerDay: 5,
    min: 0,
    max: 10,
  },
}

export const paramRegistry: ParamRegistry = {
  params: {
    beach_螃蟹: beach_螃蟹,
    beach_飞机残骸_残骸: beach_飞机残骸_残骸,
    beach_椰子: beach_椰子,
    beach_椰子树: beach_椰子树,
    beach_贝壳: beach_贝壳,
    beach_潮汐池: beach_潮汐池,
    beach_发光藻类: beach_发光藻类,
  },
}
