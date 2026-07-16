import type { DialogueDef } from '@/types/content'

export const intro: DialogueDef = {
  id: 'intro',
  title: '醒来',
  cutscene: true,
  start: 'n1',
  nodes: [
    {
      id: 'n1',
      text: '咸涩的海水拍打着你的脸。耳鸣里混着引擎熄灭后的余响。',
      next: 'n2',
    },
    {
      id: 'n2',
      text: '你在一座无名荒岛的沙滩上醒来。天空白得刺眼。',
      next: 'n3',
    },
    {
      id: 'n3',
      text: '不远处，飞机的残骸冒着细烟。故事由此开始。',
      choices: [
        {
          label: '撑起身体，看向残骸',
          next: 'n4',
          effects: [
            { type: 'setFlag', flag: 'intro_done' },
            { type: 'setLocation', locationId: 'beach' },
          ],
        },
        {
          label: '先检查自己的伤势',
          next: 'n5',
        },
      ],
    },
    {
      id: 'n4',
      text: '飞机的残骸冒着细烟。从机场出发时，你绝不会想到，这趟本来舒适的跨国旅途会以这种方式着陆。',
      next: 'n6',
    },
    {
      id: 'n5',
      text: '很幸运的是你的伤势并不严重——尤其和飞机残骸相比，除了那阵机舱的晃动与不歇的尖叫，后来的事情你已经没了印象。',
      next: 'n6',
    },
    {
      id: 'n6',
      text: '海风吹过，你站在坠毁海滩上。该想办法活下去——或者离开这里。',
      effects: [
        { type: 'setFlag', flag: 'intro_done' },
        { type: 'heal', amount: 5 },
        { type: 'setLocation', locationId: 'beach' },
        { type: 'narrative', text: '擦伤不致命。你还能动。' },
      ],
    },
  ],
}
