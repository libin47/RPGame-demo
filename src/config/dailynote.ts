// config/dailynote.ts
import type { DailyNoteConfig, DailyNoteRegistry } from '../types/dailynote'

const dailyNote_漂泊者的日记: DailyNoteConfig = {
  id: '漂泊者的日记',
  content: [
    {
      conditions: { flag: ['first_beach_explored'] },
      content: '我在这座岛上睁开眼，四周一片陌生。海风带着咸腥，远处的轮廓像一座被时光遗忘的岛屿。',
    },
    {
      conditions: { hideFlag: ['first_beach_explored'], flag: ['met_trader'] },
      content: '岸边似乎有其他幸存者活动的痕迹。这里的寒意在夜晚会更加明显。',
    },
    {
      content: '我在漂泊中留下了印记，记录下所见所闻。',
    },
  ],
}

export const dailyNoteRegistry: DailyNoteRegistry = {
  dailyNotes: {
    漂泊者的日记: dailyNote_漂泊者的日记,
  },
}
