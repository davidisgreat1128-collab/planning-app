/**
 * 规划模板数据库
 * 存储所有可用的规划模板数据
 */

export const TEMPLATE_DATABASE = {
  'tpl_1': {
    id: 'tpl_1',
    title: '一个科学的攒钱模式',
    coverImage: '/static/images/template-money.jpg',
    tags: ['培养理财能力', '财务管理'],
    users: 8141,
    userAvatars: [
      '/static/images/avatar1.png',
      '/static/images/avatar2.png',
      '/static/images/avatar3.png'
    ],
    iconEmoji: '💰',
    buff: '财富自由，从今天开始',
    duration: 30, // 天数
    milestones: [
      {
        title: '建立理财意识',
        description: '认识到理财的重要性，了解复利的力量。',
        days: '第7天'
      },
      {
        title: '制定储蓄计划',
        description: '根据收入和支出，制定合理的储蓄目标和计划。',
        days: '第15天'
      },
      {
        title: '养成记账习惯',
        description: '坚持每日记账，了解自己的消费习惯和资金流向。',
        days: '第30天'
      }
    ],
    days: Array.from({ length: 30 }, (_, i) => i + 1),
    tasksByDay: {
      1: [
        { title: '记录今日收支情况', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '设定月度储蓄目标', isRepeat: false, priority: 'high', isUrgent: true, isImportant: true }
      ],
      2: [
        { title: '记录今日收支情况', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '分析昨日消费习惯', isRepeat: false, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      7: [
        { title: '记录今日收支情况', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '复盘本周理财情况', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ],
      15: [
        { title: '记录今日收支情况', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '评估储蓄进度', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ],
      30: [
        { title: '记录今日收支情况', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '总结30天理财成果', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ]
    }
  },
  'tpl_2': {
    id: 'tpl_2',
    title: '循序渐进养成良好作息',
    coverImage: '/static/images/template-sleep-bg.jpg',
    tags: ['作息改善', '提高生活质量'],
    users: 9504,
    userAvatars: [
      '/static/images/avatar1.png',
      '/static/images/avatar2.png',
      '/static/images/avatar3.png'
    ],
    iconEmoji: '🌙',
    buff: '早睡早起，身体健康',
    duration: 30,
    milestones: [
      {
        title: '建立健康观念',
        description: '建立健康观念,健康永远是第一位的。注意是要时刻记得。如果你希望养成良好作息,那么你先要做到的事,做任何选择时都不应该以牺牲健康为代价。',
        days: '第10天'
      },
      {
        title: '锚定一日三餐时间',
        description: '确定每天三餐的固定时间,养成规律的饮食习惯。',
        days: '第20天'
      },
      {
        title: '养成自己的助眠习惯',
        description: '喝牛奶、保持一定的运动量、睡前阅读都有助于提升睡眠质量,选择最适合你的方式养成这个习惯。注意运动不要在睡前半个小时内进行。',
        days: '第30天'
      }
    ],
    days: Array.from({ length: 30 }, (_, i) => i + 1),
    tasksByDay: {
      1: [
        { title: '查资料，了解缺少睡眠的危害', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '22:00按时上床', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '每天按时吃三餐', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      2: [
        { title: '制定个人作息时间表', isRepeat: false, priority: 'high', isUrgent: true, isImportant: true },
        { title: '22:00按时上床', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '早餐7:00-8:00', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      10: [
        { title: '22:00按时上床', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '每天按时吃三餐', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '反思健康的重要性', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ],
      20: [
        { title: '22:00按时上床', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '按时吃早餐、午餐、晚餐', isRepeat: true, priority: 'high', isUrgent: false, isImportant: true }
      ],
      30: [
        { title: '22:00按时上床', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '每天按时吃三餐', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '完成助眠活动，喝牛奶或看书', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '完成今日的累积7小时睡眠', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ]
    }
  },
  'tpl_3': {
    id: 'tpl_3',
    title: '晨跑打卡计划',
    coverImage: '/static/images/template-running.jpg',
    tags: ['健康生活', '运动习惯'],
    users: 5623,
    userAvatars: [
      '/static/images/avatar1.png',
      '/static/images/avatar2.png',
      '/static/images/avatar3.png'
    ],
    iconEmoji: '🏃',
    buff: '每天进步一点点',
    duration: 21,
    milestones: [
      {
        title: '建立晨跑习惯',
        description: '开始养成晨跑的习惯，每天早起跑步。',
        days: '第7天'
      },
      {
        title: '提升跑步距离',
        description: '逐步增加跑步距离，提升体能。',
        days: '第14天'
      },
      {
        title: '完成21天挑战',
        description: '坚持21天晨跑，养成长期习惯。',
        days: '第21天'
      }
    ],
    days: Array.from({ length: 21 }, (_, i) => i + 1),
    tasksByDay: {
      1: [
        { title: '6:30起床晨跑2公里', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '记录跑步数据', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      7: [
        { title: '6:30起床晨跑3公里', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '记录跑步数据', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '回顾本周跑步成果', isRepeat: false, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      14: [
        { title: '6:30起床晨跑5公里', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '记录跑步数据', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      21: [
        { title: '6:30起床晨跑5公里', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '记录跑步数据', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '庆祝完成21天挑战', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ]
    }
  },
  'tpl_4': {
    id: 'tpl_4',
    title: '每日任务清单',
    coverImage: '/static/images/template-checklist.jpg',
    tags: ['效率提升', '时间管理'],
    users: 7234,
    userAvatars: [
      '/static/images/avatar1.png',
      '/static/images/avatar2.png',
      '/static/images/avatar3.png'
    ],
    iconEmoji: '✅',
    buff: '今日事今日毕',
    duration: 30,
    milestones: [
      {
        title: '建立任务管理习惯',
        description: '每天列出任务清单，按优先级完成。',
        days: '第10天'
      },
      {
        title: '提升执行效率',
        description: '优化任务分配，提高完成效率。',
        days: '第20天'
      },
      {
        title: '养成自律习惯',
        description: '坚持30天，养成自律的习惯。',
        days: '第30天'
      }
    ],
    days: Array.from({ length: 30 }, (_, i) => i + 1),
    tasksByDay: {
      1: [
        { title: '列出今日3件最重要的事', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '完成重要紧急任务', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '回顾今日完成情况', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true }
      ],
      10: [
        { title: '列出今日3件最重要的事', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '完成重要紧急任务', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '回顾今日完成情况', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '评估任务管理习惯', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ],
      20: [
        { title: '列出今日3件最重要的事', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '完成重要紧急任务', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '回顾今日完成情况', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '优化任务分配方法', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ],
      30: [
        { title: '列出今日3件最重要的事', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '完成重要紧急任务', isRepeat: true, priority: 'high', isUrgent: true, isImportant: true },
        { title: '回顾今日完成情况', isRepeat: true, priority: 'medium', isUrgent: false, isImportant: true },
        { title: '总结30天自律成果', isRepeat: false, priority: 'high', isUrgent: false, isImportant: true }
      ]
    }
  }
};

/**
 * 根据模板ID获取模板数据
 * @param {string} templateId - 模板ID
 * @returns {object|null} 模板数据，如果不存在则返回null
 */
export function getTemplateById(templateId) {
  return TEMPLATE_DATABASE[templateId] || null;
}
