// config/dailynote.ts
import type { DailyNoteConfig, DailyNoteRegistry } from '../types/dailynote'

const note_漂泊者的日记: DailyNoteConfig = {
  id: '漂泊者的日记',
  content: [
    {
      content: '空难——从没想到，这次旅行会以这种方式结束。\n但最幸运也最重要的是，我活了下来。',
    },
    {
      content: '我在飞机的残骸里找到了一个笔记本和一支笔，也许我可以在这里记录下我的经历。',
    },
  ],
}
const note_螃蟹: DailyNoteConfig = {
  id: '螃蟹',
  content: [
    {
      content:
        '在坠机的沙滩上，我发现了一些巨大的螃蟹……。\n很奇怪，这些螃蟹不仅个头巨大无比，而且高举着蟹钳就像真的战士一般，如非必要，我还是不要去招惹它们了。',
    },
  ],
}
const note_螃蟹_战胜: DailyNoteConfig = {
  id: '螃蟹_战胜',
  content: [
    {
      content:
        '没有食物，我还是不得不去“狩猎”螃蟹了。\n它们甲壳上布满了奇怪的绿色纹路，肉质也腥不可闻。这座岛就不太不正常。\n如果不是实在太饿，我再不想再吃这东西了。',
    },
  ],
}
const note_猴王1: DailyNoteConfig = {
  id: '猴王1',
  content: [
    {
      content: '我在沙滩额椰树林中，遇到了一群奇怪的猴子，他们似乎在阻止我进入这片椰树林。',
    },
  ],
}

export const dailyNoteRegistry: DailyNoteRegistry = {
  dailyNotes: {
    note_漂泊者的日记,
    note_螃蟹,
    note_螃蟹_战胜,
    note_猴王1,
  },
}
