const recipes = [
  {
    id: 'recipe-1',
    name: '番茄鸡蛋蝴蝶面',
    description: '酸甜开胃，补充蛋白质和碳水。',
    imageText: '🍅',
    minAgeMonths: 10,
    maxAgeMonths: 48,
    ageLabel: '10月龄+',
    cookingTime: 15,
    difficulty: '简单',
    tags: ['补蛋白', '易消化'],
    allergens: ['鸡蛋'],
    ingredients: [
      { name: '蝴蝶面', quantity: '30g' },
      { name: '番茄', quantity: '1个（约100g）' },
      { name: '鸡蛋黄', quantity: '1个' },
      { name: '核桃油', quantity: '2滴' }
    ],
    steps: [
      '番茄划十字烫去皮，切成小丁。',
      '锅中倒入核桃油，炒番茄至出汁。',
      '加适量清水煮开，下蝴蝶面煮软。',
      '淋入蛋黄液，搅拌 1 分钟即可出锅。'
    ],
    tips: '番茄尽量选择熟透的，味道更柔和。',
    nutrition: '番茄富含维生素 C，蛋黄补铁补蛋白。',
    rating: 4.8,
    madeCount: 215,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-2',
    name: '西兰花炒虾仁 + 软米饭',
    description: '补钙又有口感，适合练习咀嚼。',
    imageText: '🥦',
    minAgeMonths: 12,
    maxAgeMonths: 60,
    ageLabel: '1岁+',
    cookingTime: 20,
    difficulty: '简单',
    tags: ['补钙', '高蛋白'],
    allergens: ['海鲜'],
    ingredients: [
      { name: '西兰花', quantity: '50g' },
      { name: '虾仁', quantity: '6只' },
      { name: '软米饭', quantity: '1小碗' }
    ],
    steps: [
      '西兰花焯水切碎，虾仁去虾线。',
      '锅中少油，先炒虾仁再下西兰花。',
      '加少量温水焖 2 分钟，搭配软米饭食用。'
    ],
    tips: '虾仁可切碎后再炒，更适合小龄宝宝。',
    nutrition: '虾仁补充优质蛋白和钙，西兰花补充维生素。',
    rating: 4.7,
    madeCount: 168,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-3',
    name: '南瓜小米粥 + 蒸鳕鱼',
    description: '温和好消化，晚餐更轻松。',
    imageText: '🎃',
    minAgeMonths: 10,
    maxAgeMonths: 60,
    ageLabel: '10月龄+',
    cookingTime: 25,
    difficulty: '简单',
    tags: ['易消化', '补锌'],
    allergens: ['鱼类'],
    ingredients: [
      { name: '南瓜', quantity: '80g' },
      { name: '小米', quantity: '25g' },
      { name: '鳕鱼', quantity: '60g' }
    ],
    steps: [
      '南瓜切块与小米同煮成粥。',
      '鳕鱼去刺，隔水蒸 8 分钟。',
      '将蒸好的鳕鱼撕成小块搭配粥食用。'
    ],
    tips: '鳕鱼蒸后检查鱼刺，确保入口安全。',
    nutrition: '南瓜富含胡萝卜素，鳕鱼补充优质蛋白。',
    rating: 4.9,
    madeCount: 263,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-4',
    name: '奶酪虾仁饼',
    description: '适合补钙期，香软易抓握。',
    imageText: '🧀',
    minAgeMonths: 14,
    maxAgeMonths: 60,
    ageLabel: '14月龄+',
    cookingTime: 18,
    difficulty: '中等',
    tags: ['补钙', '手指食物'],
    allergens: ['海鲜', '牛奶'],
    ingredients: [
      { name: '虾仁', quantity: '80g' },
      { name: '奶酪碎', quantity: '20g' },
      { name: '土豆泥', quantity: '50g' }
    ],
    steps: [
      '虾仁剁碎，与土豆泥、奶酪碎拌匀。',
      '整理成小圆饼，平底锅小火两面煎熟。'
    ],
    tips: '奶酪用低钠款，煎制时少油即可。',
    nutrition: '补钙和优质蛋白兼具，适合食欲一般时补营养。',
    rating: 4.6,
    madeCount: 121,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-5',
    name: '牛油果香蕉奶昔',
    description: '热量密度高，适合需要增重阶段。',
    imageText: '🥑',
    minAgeMonths: 12,
    maxAgeMonths: 60,
    ageLabel: '1岁+',
    cookingTime: 8,
    difficulty: '简单',
    tags: ['增重', '高能量'],
    allergens: ['牛奶'],
    ingredients: [
      { name: '牛油果', quantity: '半个' },
      { name: '香蕉', quantity: '半根' },
      { name: '配方奶', quantity: '150ml' }
    ],
    steps: [
      '牛油果与香蕉切块。',
      '加入配方奶打成细腻奶昔。'
    ],
    tips: '现打现喝，口感最佳。',
    nutrition: '提供优质脂肪和能量，适合作为加餐。',
    rating: 4.5,
    madeCount: 97,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-6',
    name: '菠菜猪肝面',
    description: '补铁组合，适合生长发育期。',
    imageText: '🥬',
    minAgeMonths: 11,
    maxAgeMonths: 60,
    ageLabel: '11月龄+',
    cookingTime: 18,
    difficulty: '中等',
    tags: ['补铁', '高蛋白'],
    allergens: ['小麦'],
    ingredients: [
      { name: '猪肝', quantity: '20g' },
      { name: '菠菜', quantity: '35g' },
      { name: '宝宝面', quantity: '30g' }
    ],
    steps: [
      '猪肝浸泡去腥，焯水后剁泥。',
      '菠菜焯水切碎，下面条煮软。',
      '加入猪肝泥和菠菜再煮 2 分钟。'
    ],
    tips: '猪肝一周 1-2 次即可，不宜过量。',
    nutrition: '富含铁和叶酸，对补铁期友好。',
    rating: 4.7,
    madeCount: 146,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-7',
    name: '胡萝卜肉末蒸蛋',
    description: '嫩滑易吞咽，适合午餐补蛋白。',
    imageText: '🥕',
    minAgeMonths: 9,
    maxAgeMonths: 60,
    ageLabel: '9月龄+',
    cookingTime: 16,
    difficulty: '简单',
    tags: ['补蛋白', '细腻口感'],
    allergens: ['鸡蛋'],
    ingredients: [
      { name: '鸡蛋', quantity: '1个' },
      { name: '肉末', quantity: '20g' },
      { name: '胡萝卜', quantity: '20g' }
    ],
    steps: [
      '鸡蛋打散加温水，过滤后入碗。',
      '肉末和胡萝卜碎焯熟后放表面。',
      '冷水入锅蒸 10 分钟。'
    ],
    tips: '加盖保鲜膜可减少蜂窝，口感更嫩。',
    nutrition: '蛋白质和胡萝卜素丰富。',
    rating: 4.8,
    madeCount: 184,
    videoLabel: '查看完整视频'
  },
  {
    id: 'recipe-8',
    name: '牛奶燕麦粥',
    description: '早餐快捷方案，饱腹感强。',
    imageText: '🥣',
    minAgeMonths: 12,
    maxAgeMonths: 60,
    ageLabel: '1岁+',
    cookingTime: 10,
    difficulty: '简单',
    tags: ['早餐快手', '补钙'],
    allergens: ['牛奶', '燕麦'],
    ingredients: [
      { name: '燕麦片', quantity: '25g' },
      { name: '配方奶', quantity: '180ml' },
      { name: '蓝莓', quantity: '4颗' }
    ],
    steps: [
      '燕麦加入温奶小火煮 4 分钟。',
      '出锅后撒少量蓝莓碎即可。'
    ],
    tips: '蓝莓可替换成熟香蕉，更柔软。',
    nutrition: '补钙同时兼顾膳食纤维。',
    rating: 4.4,
    madeCount: 89,
    videoLabel: '查看完整视频'
  }
]

const users = {
  current: {
    id: 'user-1',
    nickname: '妈妈小厨',
    avatarImage: '/assets/avatars/mom-q.svg',
    bio: '记录宝宝每一口成长的小小营养官',
    elderMode: false,
    agreementsAccepted: true
  }
}

const babies = [
  {
    id: 'baby-1',
    nickname: '小宝',
    gender: '男',
    birthDate: '2023-02-10',
    allergies: [],
    dietaryPreferences: ['爱吃肉', '爱吃水果'],
    avatarImage: '/assets/avatars/boy-q.svg',
    active: true
  },
  {
    id: 'baby-2',
    nickname: '团团',
    gender: '女',
    birthDate: '2024-01-02',
    allergies: ['鸡蛋'],
    dietaryPreferences: ['爱吃蔬菜'],
    avatarImage: '/assets/avatars/girl-q.svg',
    active: false
  }
]

const growthRecords = {
  'baby-1': [
    { id: 'g1', measuredDate: '2025-08-01', height: 89.4, weight: 12.6 },
    { id: 'g2', measuredDate: '2025-11-01', height: 91.8, weight: 13.1 },
    { id: 'g3', measuredDate: '2026-02-01', height: 94.2, weight: 13.7 },
    { id: 'g4', measuredDate: '2026-04-15', height: 96.5, weight: 14.2 }
  ],
  'baby-2': [
    { id: 'g5', measuredDate: '2025-08-01', height: 69.2, weight: 7.9 },
    { id: 'g6', measuredDate: '2025-11-01', height: 73.1, weight: 8.6 },
    { id: 'g7', measuredDate: '2026-02-01', height: 77.4, weight: 9.4 },
    { id: 'g8', measuredDate: '2026-04-15', height: 80.3, weight: 10.1 }
  ]
}

const dailyRecommendationTemplate = {
  'baby-1': {
    breakfast: 'recipe-1',
    lunch: 'recipe-2',
    dinner: 'recipe-3',
    suggestions: ['recipe-4', 'recipe-6', 'recipe-7']
  },
  'baby-2': {
    breakfast: 'recipe-8',
    lunch: 'recipe-7',
    dinner: 'recipe-3',
    suggestions: ['recipe-1', 'recipe-5', 'recipe-6']
  }
}

module.exports = {
  recipes,
  users,
  babies,
  growthRecords,
  dailyRecommendationTemplate
}
