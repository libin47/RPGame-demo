import type { ContentRegistry, Id } from '@/types/content'
import { characters } from './characters'
import { beach } from './locations/beach'
import { wreck } from './locations/wreck'
import { jungleEdge, signalRidge } from './locations/jungle'
import { intro } from './dialogues/intro'
import { castaway } from './dialogues/castaway'
import { seaFolk } from './dialogues/sea_folk'
import { items } from './items'
import { recipes } from './recipes'
import { enemies } from './enemies'
import { beachCave } from './dungeons/beach_cave'
import { endings } from './endings'
import { texts } from './texts'

function byId<T extends { id: Id }>(list: T[]): Record<Id, T> {
  return Object.fromEntries(list.map((x) => [x.id, x])) as Record<Id, T>
}

export const content: ContentRegistry = {
  characters: byId(characters),
  locations: byId([beach, wreck, jungleEdge, signalRidge]),
  dialogues: byId([intro, castaway, seaFolk]),
  items: byId(items),
  recipes: byId(recipes),
  enemies: byId(enemies),
  dungeons: byId([beachCave]),
  endings: byId(endings),
  texts: byId(texts),
}

export function getContent(): ContentRegistry {
  return content
}
