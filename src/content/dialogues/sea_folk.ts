import type { DialogueDef } from '@/types/content'

export const seaFolk: DialogueDef = {
  id: 'sea_folk',
  title: '与海民对话',
  cutscene: false,
  start: 'n1',
  nodes: [
    {
      id: 'n1',
      text: '那个半人半鱼的生物缓缓转过身，他的眼睛闪烁着诡异的光芒。"你……也是被选中的吗？"他用沙哑的声音问道。',
      choices: [
        {
          label: '"你是谁？"',
          next: 'n2',
        },
        {
          label: '"选中什么？"',
          next: 'n3',
        },
        {
          label: '攻击！',
          next: 'n_attack',
        },
      ],
    },
    {
      id: 'n2',
      text: '"我？"他似乎觉得这个问题很有趣，"我曾经也是人类。但现在……我是海民。是大海的使者。"他指了指自己的鱼鳍手臂，"这片海选择了我。"',
      choices: [
        {
          label: '"大海？什么意思？"',
          next: 'n4',
        },
        {
          label: '"你怎么变成这样的？"',
          next: 'n5',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n3',
      text: '"选中。"他重复着，"这座岛正在觉醒。旧神即将归来。而我们……"他笑了，露出尖锐的牙齿，"我们将成为祂的仆人。"',
      effects: [
        { type: 'modSan', delta: -5 },
      ],
      choices: [
        {
          label: '"旧神？那是什么？"',
          next: 'n6',
        },
        {
          label: '"你在说什么疯话！"',
          next: 'n7',
        },
        {
          label: '攻击！',
          next: 'n_attack',
        },
      ],
    },
    {
      id: 'n4',
      text: '"这片海不是普通的海。"他的声音变得低沉，"它来自星空之外。海底深处沉睡着古老的存在。孢子唤醒了它们……也唤醒了我们。"',
      effects: [
        { type: 'modSan', delta: -3 },
      ],
      choices: [
        {
          label: '"你在说胡话！"',
          next: 'n7',
        },
        {
          label: '"这和飞机坠毁有什么关系？"',
          next: 'n8',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n5',
      text: '"三年前，我也是个幸存者。"他回忆着，"和你一样，试图逃离这座岛。但后来……我听见了大海的呼唤。祂接纳了我。赐予我新的形态。"',
      effects: [
        { type: 'modSan', delta: -2 },
      ],
      choices: [
        {
          label: '"你自愿变成这样？"',
          next: 'n9',
        },
        {
          label: '"这太可怕了……"',
          next: 'n10',
        },
        {
          label: '攻击！',
          next: 'n_attack',
        },
      ],
    },
    {
      id: 'n6',
      text: '"旧神。"他虔诚地说，"早在人类诞生之前就存在于这片星空。它们沉睡在深海，等待着觉醒的时刻。孢子就是钥匙……而我们，是祂的使者。"',
      effects: [
        { type: 'modSan', delta: -5 },
      ],
      choices: [
        {
          label: '"我不会让那种事发生！"',
          next: 'n_attack',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n7',
      text: '"疯话？"他的表情变得狰狞，"你很快就会明白的。当你的身体开始变化，当你听见祂的声音……到时候，你就会理解了。"',
      effects: [
        { type: 'modSan', delta: -3 },
      ],
      choices: [
        {
          label: '"我绝不会变成你这样！"',
          next: 'n_attack',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n8',
      text: '"飞机？那不是事故。"他冷冷地说，"是祂的召唤。所有来到这座岛的人，都是被选中的。你们以为是意外？不……是祂在挑选。"',
      effects: [
        { type: 'modSan', delta: -4 },
      ],
      choices: [
        {
          label: '"你在撒谎！"',
          next: 'n_attack',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n9',
      text: '"自愿？"他大笑起来，声音像海浪拍击礁石，"一开始不是。但后来……祂的声音如此温柔。接纳我，拥抱我，让我成为更伟大的存在。你也会的。"',
      effects: [
        { type: 'modSan', delta: -4 },
      ],
      choices: [
        {
          label: '"我绝不会接受！"',
          next: 'n_attack',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n10',
      text: '"可怕？"他歪着头，似乎无法理解你的恐惧，"这是进化。是超越。人类的形态太脆弱了……而我们，将成为永恒。"',
      choices: [
        {
          label: '"我宁愿死也不要变成怪物！"',
          next: 'n_attack',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n_attack',
      text: '海民的表情变得狰狞。"既然你选择抗拒……那就成为食物吧！"',
      effects: [
        { type: 'startCombat', enemyId: 'sea_folk' },
      ],
    },
    {
      id: 'n_end',
      text: '你转身离开，海民的笑声在背后响起，像海浪般令人不安。',
    },
    {
      id: 'n_victory',
      text: '海民倒下了，他的身体在阳光下逐渐消散。你在他身上找到了一些金属碎片。',
      effects: [
        { type: 'addItem', itemId: 'scrap_metal', count: 10 },
      ],
    },
    {
      id: 'n_defeat',
      text: '海民轻松地击败了你。"可怜的虫子……"他嘲笑着，"你的抗拒毫无意义。"他没有杀你，只是让你带着羞辱离开。',
      effects: [
        { type: 'modAttr', attr: 'hp', delta: -99 },
        { type: 'setFlag', flag: 'sea_folk_defeated' },
      ],
    },
  ],
}
