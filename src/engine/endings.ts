import type { ContentRegistry, EndingDef } from '@/types/content'
import type { ConditionContext } from './conditions'
import { evalWhen } from './conditions'

export function checkEndings(content: ContentRegistry, ctx: ConditionContext): EndingDef | null {
  const endings = Object.values(content.endings).sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  )
  for (const ending of endings) {
    if (evalWhen(ending.when, ctx)) return ending
  }
  return null
}
