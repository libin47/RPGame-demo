// config/dailynote.ts
import type { DailyNoteConfig, DailyNoteRegistry } from '../types/dailynote'

const dailyNote_漂泊者的日记: DailyNoteConfig = {
  id: '漂泊者的日记',
  content: [
    {
      content: '我很幸运的活了下来。',
    },
    {
      content: '我在飞机的残骸里找到了一个笔记本和一支笔，也许我可以在这里记录下我的经历。',
    },
  ],
}

export const dailyNoteRegistry: DailyNoteRegistry = {
  dailyNotes: {
    漂泊者的日记: dailyNote_漂泊者的日记,
  },
}
