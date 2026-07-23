// config/registry.ts
import type { GameRegistry } from '../types/registry'
import { damageTypeRegistry } from './damageTypes'
import { weaponTypeRegistry } from './weaponTypes'
import { skillRegistry } from './skills'
import { statusRegistry } from './statuses'
import { itemRegistry } from './items'
import { enemyRegistry } from './enemies'
import { craftRecipeRegistry } from './craftRecipes'
import { cookRecipeRegistry } from './cookRecipes'
import { buildRecipeRegistry } from './buildRecipes'
import { tradeRegistry } from './traders'
import { flagRegistry } from './flags'
import { sceneRegistry } from './scenes'
import { eventRegistry } from './events'
import { cgRegistry } from './cgs'
import { seasonWeatherRegistry } from './seasonWeather'
import { characterRegistry } from './characters'
import { mapRegistry } from './maps'
import { buildRegistry } from './buildings'
import { endingRegistry } from './endings'

export const gameRegistry: GameRegistry = {
  buildings: buildRegistry,
  scenes: sceneRegistry,
  events: eventRegistry,
  cgs: cgRegistry,
  items: itemRegistry,
  weaponTypes: weaponTypeRegistry,
  damageTypes: damageTypeRegistry,
  skills: skillRegistry,
  enemies: enemyRegistry,
  craftRecipes: craftRecipeRegistry,
  cookRecipes: cookRecipeRegistry,
  buildRecipes: buildRecipeRegistry,
  statuses: statusRegistry,
  traders: tradeRegistry,
  flags: flagRegistry,
  seasonWeather: seasonWeatherRegistry,
  maps: mapRegistry,
  characters: characterRegistry,
  endings: endingRegistry,
}
