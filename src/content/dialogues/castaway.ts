import type { DialogueDef } from '@/types/content'

export const castaway: DialogueDef = {
  id: 'castaway',
  title: '与漂流者对话',
  cutscene: false,
  start: 'n1',
  nodes: [
    {
      id: 'n1',
      text: '你看到沙滩上坐着一个人。他穿着破旧的衬衫，眼神空洞地望着大海。',
      next: 'n2',
    },
    {
      id: 'n2',
      text: '注意到你的接近，他缓缓转过头来。"又一个……"他低声说。',
      choices: [
        {
          label: '"你是谁？这里是哪里？"',
          next: 'n3',
        },
        {
          label: '"你还好吗？需要帮助吗？"',
          next: 'n4',
        },
        {
          label: '保持沉默，观察他',
          next: 'n5',
        },
      ],
    },
    {
      id: 'n3',
      text: '"名字？已经不重要了。"他苦笑着，"这里是蚀岛。你出不去的。没有人能出去。"',
      choices: [
        {
          label: '"为什么？"',
          next: 'n6',
        },
        {
          label: '"我一定会离开这里。"',
          next: 'n7',
        },
      ],
    },
    {
      id: 'n4',
      text: '"帮助？"他抬起头，似乎觉得你的话很有趣，"帮我离开这个鬼地方？算了吧，孩子。我已经在这里待了三年。"',
      choices: [
        {
          label: '"三年？！"',
          next: 'n8',
        },
        {
          label: '"你知道怎么离开吗？"',
          next: 'n9',
        },
      ],
    },
    {
      id: 'n5',
      text: '他似乎对你的沉默感到满意。"明智的选择。多说无益。"他指了指飞机残骸的方向，"那里还有些能用的东西。趁还没天黑，赶紧去找找。"',
      effects: [
        { type: 'setFlag', flag: 'know_wreck' },
        { type: 'unlockLocation', locationId: 'wreck' },
      ],
      choices: [
        {
          label: '谢谢他的提示',
          next: 'n_end',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n6',
      text: '"五年前，一场海底地震。"他的声音变得低沉，"释放了某种……东西。SCP基金会封锁了整个岛屿。没有船，没有飞机，什么都进不来，也出不去。"',
      choices: [
        {
          label: '"SCP基金会？"',
          next: 'n10',
        },
        {
          label: '"那东西是什么？"',
          next: 'n11',
        },
      ],
    },
    {
      id: 'n7',
      text: '"勇气可嘉。"他叹了口气，"但希望会慢慢消磨你的意志。如果你真的想走，去岛中心的信号塔看看。不过……"他欲言又止，"小心那些东西。"',
      effects: [
        { type: 'setFlag', flag: 'know_signal_ridge' },
      ],
      choices: [
        {
          label: '"那些东西？"',
          next: 'n12',
        },
        {
          label: '感谢他的信息',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n8',
      text: '"三年。"他重复着，"刚开始的时候，我也像你一样。想着求救，想着逃离。现在……"他摸了摸自己的手臂，那里有一些奇怪的纹路，"我已经不在乎了。"',
      choices: [
        {
          label: '你的手臂怎么了？',
          next: 'n13',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n9',
      text: '"离开？唯一的办法是修复岛中心的信号塔。但那里已经被……变异体占据了。"他摇了摇头，"除非你有足够的武器和勇气。"',
      effects: [
        { type: 'setFlag', flag: 'know_signal_ridge' },
      ],
      choices: [
        {
          label: '询问变异体的情况',
          next: 'n12',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n10',
      text: '"你听说过？"他有些惊讶，"那你应该知道，他们不会让任何人离开。这个岛屿已经被完全隔离了。"',
      choices: [
        {
          label: '"那我们只能等死吗？"',
          next: 'n14',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n11',
      text: '"一种孢子。来自深海。会让生物……变异。"他凑近了一些，"你看到那些纹路了吗？"他卷起袖子，手臂上布满了黑色的纹路，"我也快了。"',
      choices: [
        {
          label: '太可怕了……',
          next: 'n15',
        },
        {
          label: '有没有办法阻止？',
          next: 'n16',
        },
      ],
    },
    {
      id: 'n12',
      text: '"岛上的生物都变异了。有些变得极具攻击性，有些……"他颤抖了一下，"有些变得不像这个世界的东西。晚上不要外出。"',
      effects: [
        { type: 'modSan', delta: -3 },
      ],
      choices: [
        {
          label: '我会小心的',
          next: 'n_end',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n13',
      text: '"这是孢子的影响。"他平静地说，"每个人都会这样。只是时间问题。"他看着你，"也许你还有机会。趁着理智还在。"',
      effects: [
        { type: 'modSan', delta: -2 },
      ],
      choices: [
        {
          label: '"我会找到办法的。"',
          next: 'n_end',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n14',
      text: '"不一定。"他说，"有些人选择了……接受。融入这个岛。也许那也是一种活着的方式。"他的眼神变得迷离，"或者你可以试试修好信号塔。"',
      effects: [
        { type: 'setFlag', flag: 'know_signal_ridge' },
      ],
      choices: [
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n15',
      text: '"是的，可怕。"他苦笑，"但你必须习惯。在这里，恐惧是最没用的东西。活下去才是。"',
      choices: [
        {
          label: '"我会活下去的。"',
          next: 'n_end',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n16',
      text: '"阻止？"他摇摇头，"除非你能找到孢子的源头并摧毁它。但那东西在深海之下。没有人能到达那里。"',
      choices: [
        {
          label: '"也许有办法。"',
          next: 'n_end',
        },
        {
          label: '离开',
          next: 'n_end',
        },
      ],
    },
    {
      id: 'n_end',
      text: '他不再说话，重新望向大海。你转身离开，心里充满了不安。',
    },
  ],
}
