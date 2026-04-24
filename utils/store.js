const { recipes, users, babies, growthRecords, dailyRecommendationTemplate } = require('./mock-data')
const { calculateAgeMonths, formatDate, getWeekLabel, getShortDate } = require('./format')
const { getPercentileInfo, buildHeightChartData, buildWeightChartData } = require('./growth-standard')
const { isPersistableAvatar } = require('./avatar')

function normalizeAvatar(source, fallback) {
  return isPersistableAvatar(source) ? source : fallback
}

const STORAGE_KEY = 'mommy-kitchen-helper-state'
const TOKEN_KEY = 'mommy-kitchen-helper-token'

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function createInitialState() {
  return {
    user: clone(users.current),
    babies: clone(babies),
    recipes: clone(recipes),
    growthRecords: clone(growthRecords),
    collections: ['recipe-1', 'recipe-3'],
    madeRecipes: [{ recipeId: 'recipe-3', babyId: 'baby-1', date: '2026-04-18' }],
    todayRecommendationSeed: clone(dailyRecommendationTemplate),
    weeklyPlans: {},
    confirmedWeeklyPlans: {},
    family: {
      id: 'family-1',
      name: `${users.current.nickname}的家庭`,
      myRole: 'owner'
    },
    familyMembers: [{
      id: 'family-member-1',
      role: 'owner',
      relation: '自己',
      user: {
        id: users.current.id,
        nickname: users.current.nickname,
        avatar_url: users.current.avatarImage || users.current.avatarUrl
      }
    }],
    isLoggedIn: false
  }
}

function getState() {
  const state = wx.getStorageSync(STORAGE_KEY) || createInitialState()
  state.weeklyPlans = state.weeklyPlans || {}
  state.confirmedWeeklyPlans = state.confirmedWeeklyPlans || {}
  state.todayRecommendationSeed = state.todayRecommendationSeed || {}
  return state
}

function setState(nextState) {
  wx.setStorageSync(STORAGE_KEY, nextState)
  return nextState
}

function initialize() {
  if (!wx.getStorageSync(STORAGE_KEY)) {
    setState(createInitialState())
  }
}

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

function getCurrentBaby(state) {
  const targetState = state || getState()
  return targetState.babies.find(item => item.active) || targetState.babies[0] || null
}

function normalizeRecipe(recipeId, state) {
  const targetState = state || getState()
  return targetState.recipes.find(item => item.id === recipeId)
}

function buildRecipeCard(recipe, state) {
  if (!recipe) return null
  const targetState = state || getState()
  const tags = recipe.tags || []
  return {
    ...recipe,
    tags,
    primaryTag: tags[0] || '',
    isCollected: targetState.collections.includes(recipe.id),
    madeTimes: targetState.madeRecipes.filter(item => item.recipeId === recipe.id).length
  }
}

function getGrowthRecommendedRecipes(baby, state, limit = 2) {
  if (!baby) return []
  const ageMonths = baby.ageMonths !== undefined ? baby.ageMonths : calculateAgeMonths(baby.birthDate)
  const allergies = baby.allergies || []
  const candidates = state.recipes.filter(item => {
    if (!item || !item.id || !item.name) return false
    const minAge = Number(item.minAgeMonths || 0)
    const maxAge = Number(item.maxAgeMonths || 72)
    const ageMatch = minAge <= ageMonths && maxAge >= ageMonths
    const allergySafe = !allergies.some(tag => (item.allergens || []).includes(tag))
    return ageMatch && allergySafe
  })
  const keywords = ['钙', '铁', '蛋白', '牛肉', '鸡蛋', '豆腐', '虾', '鱼', '奶']
  const preferred = candidates.filter(item => {
    const text = [item.name, item.description, ...(item.tags || [])].join(' ')
    return keywords.some(keyword => text.indexOf(keyword) >= 0)
  })
  const source = preferred.length ? preferred : candidates
  return source
    .slice(0, limit)
    .map(item => buildRecipeCard(item, state))
    .filter(Boolean)
}

function login() {
  const state = getState()
  state.isLoggedIn = true
  setState(state)
  return clone(state.user)
}

function getOverview() {
  const state = getState()
  const currentBaby = getCurrentBaby(state)
  if (currentBaby) {
    applyConfirmedWeeklyPlanToTodaySeed(state, currentBaby.id)
  }
  const today = currentBaby ? getTodayRecommendation(currentBaby.id, state) : {}
  return {
    user: clone(state.user),
    babies: clone(state.babies).map(item => decorateBaby(item)),
    currentBaby: currentBaby ? decorateBaby(currentBaby) : null,
    todayRecommendation: today,
    collectionsCount: state.collections.length,
    madeCount: state.madeRecipes.length,
    hasConfirmedWeeklyPlan: currentBaby ? !!getConfirmedWeeklyPlan(currentBaby.id, state) : false
  }
}

function decorateBaby(baby) {
  if (!baby) return null
  return {
    ...baby,
    ageMonths: calculateAgeMonths(baby.birthDate),
    ageText: require('./format').formatAgeText(baby.birthDate),
    allergyText: baby.allergies && baby.allergies.length ? baby.allergies.join('、') : '无过敏',
    preferenceText: baby.dietaryPreferences && baby.dietaryPreferences.length ? baby.dietaryPreferences.join('、') : '暂未设置',
    actionText: baby.active ? '当前宝宝' : '编辑'
  }
}

function getTodayRecommendation(babyId, snapshot) {
  const state = snapshot || getState()
  ensureRecommendationSeeds(state)
  applyConfirmedWeeklyPlanToTodaySeed(state, babyId)
  if (!babyId || !state.todayRecommendationSeed[babyId]) {
    return {
      breakfast: null,
      lunch: null,
      dinner: null,
      suggestions: []
    }
  }
  const seed = state.todayRecommendationSeed[babyId]
  return {
    breakfast: buildRecipeCard(normalizeRecipe(seed.breakfast, state), state),
    lunch: buildRecipeCard(normalizeRecipe(seed.lunch, state), state),
    dinner: buildRecipeCard(normalizeRecipe(seed.dinner, state), state),
    suggestions: seed.suggestions.map(id => buildRecipeCard(normalizeRecipe(id, state), state))
  }
}

function swapMeal(babyId, mealType) {
  const state = getState()
  ensureRecommendationSeeds(state)
  const recommendationSeed = state.todayRecommendationSeed[babyId] || {}
  const currentId = recommendationSeed[mealType]
  const excludedIds = Object.keys(recommendationSeed)
    .filter(key => ['breakfast', 'lunch', 'dinner'].includes(key))
    .map(key => recommendationSeed[key])
    .filter(Boolean)
  const baby = state.babies.find(item => item.id === babyId)
  const available = state.recipes.filter(item => {
    const ageMatch = calculateAgeMonths(baby.birthDate) >= item.minAgeMonths
    const allergySafe = !(baby.allergies || []).some(tag => item.allergens.includes(tag))
    return ageMatch && allergySafe && !excludedIds.includes(item.id)
  })
  const nextRecipe = available[0] || state.recipes.find(item => item.id && item.id !== currentId && !excludedIds.filter(id => id !== currentId).includes(item.id))
  state.todayRecommendationSeed[babyId][mealType] = nextRecipe.id
  setState(state)
  return getTodayRecommendation(babyId, state)
}

function getRecipeById(recipeId) {
  const state = getState()
  const recipe = normalizeRecipe(recipeId, state)
  if (!recipe) return null
  return buildRecipeCard(recipe, state)
}

function toggleCollection(recipeId) {
  const state = getState()
  const index = state.collections.indexOf(recipeId)
  if (index >= 0) {
    state.collections.splice(index, 1)
  } else {
    state.collections.unshift(recipeId)
  }
  setState(state)
  return state.collections.includes(recipeId)
}

function markRecipeMade(recipeId, babyId) {
  const state = getState()
  state.madeRecipes.unshift({
    recipeId,
    babyId,
    date: formatDate(new Date())
  })
  setState(state)
  return true
}

function filterRecipes(params = {}) {
  const state = getState()
  const currentBaby = getCurrentBaby(state)
  let list = state.recipes.slice()
  if (params.keyword) {
    list = list.filter(item => item.name.indexOf(params.keyword) >= 0)
  }
  if (params.ageRange && params.ageRange !== '全部') {
    const map = {
      '6-8月': [6, 8],
      '8-10月': [8, 10],
      '10-12月': [10, 12],
      '1-2岁': [12, 24],
      '2-3岁': [24, 36],
      '3岁+': [36, 72]
    }
    const range = map[params.ageRange]
    if (range) {
      list = list.filter(item => item.minAgeMonths <= range[1] && item.maxAgeMonths >= range[0])
    }
  } else if (params.onlyCurrentBaby) {
    const ageMonths = calculateAgeMonths(currentBaby.birthDate)
    list = list.filter(item => item.minAgeMonths <= ageMonths && item.maxAgeMonths >= ageMonths)
  }
  if (params.tag && params.tag !== '全部') {
    list = list.filter(item => item.tags.includes(params.tag))
  }
  return list.map(item => buildRecipeCard(item, state))
}

function getCollectedRecipes() {
  const state = getState()
  return state.collections
    .map(recipeId => normalizeRecipe(recipeId, state))
    .filter(Boolean)
    .map(item => buildRecipeCard(item, state))
}

function getMadeRecipes() {
  const state = getState()
  const seen = new Set()
  return state.madeRecipes
    .map(item => item.recipeId)
    .filter(recipeId => {
      if (seen.has(recipeId)) return false
      seen.add(recipeId)
      return true
    })
    .map(recipeId => normalizeRecipe(recipeId, state))
    .filter(Boolean)
    .map(item => buildRecipeCard(item, state))
}

function getCreatedRecipes() {
  const state = getState()
  return state.recipes
    .filter(item => item.authorUserId === state.user.id || item.createdByUserId === state.user.id || item.isMine)
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
    .map(item => buildRecipeCard({ ...item, isMine: true }, state))
}

function switchBaby(babyId) {
  const state = getState()
  state.babies = state.babies.map(item => ({
    ...item,
    active: item.id === babyId
  }))
  setState(state)
  return decorateBaby(getCurrentBaby(state))
}

function getGrowthLevelLabel(percentile) {
  if (percentile <= 3) return '偏低'
  if (percentile <= 15) return '略偏低'
  if (percentile < 85) return '正常范围'
  if (percentile < 97) return '偏高'
  return '较高'
}

function getGrowthTrendLabel(heightChange, weightChange) {
  const h = Number(heightChange)
  const w = Number(weightChange)
  if (h > 0 && w > 0) return '近期增长趋势稳定'
  if (h > 0 && w <= 0) return '身高在增长，体重变化不明显'
  if (h <= 0 && w > 0) return '体重有增加，身高变化较小'
  return '近期变化不大，建议持续观察'
}

function buildGrowthInterpretation(measureLabel, percentileInfo, heightChange, weightChange) {
  const percentile = percentileInfo.percentile
  const levelLabel = getGrowthLevelLabel(percentile)
  const trendLabel = getGrowthTrendLabel(heightChange, weightChange)

  if (percentile <= 3) {
    return `${measureLabel}目前处在同龄儿童里偏下的位置，大约在 ${percentileInfo.percentileText} 附近。简单理解，就是在同龄宝宝里会显得偏矮一些，但不代表单次记录就一定异常，建议继续观察最近几次曲线是否持续沿着自己的节奏增长。${trendLabel}。`
  }

  if (percentile <= 15) {
    return `${measureLabel}目前在同龄儿童里属于略偏下，但仍可结合连续趋势一起看。现在大约位于 ${percentileInfo.percentileText}，说明整体不算高个型宝宝，不过只要曲线持续平稳向上，通常比单次高低更有参考意义。${trendLabel}。`
  }

  if (percentile < 85) {
    return `${measureLabel}目前处在同龄儿童的正常范围内，大约位于 ${percentileInfo.percentileText}。通俗地说，就是和大多数同龄宝宝相比处于比较常见的位置，属于比较让人放心的区间。${trendLabel}。`
  }

  return `${measureLabel}目前在同龄儿童里属于${levelLabel}，大约位于 ${percentileInfo.percentileText}。这通常说明当前生长表现不错，但判断是否“优秀”更建议结合连续几次记录一起看，而不是只看单个数值。${trendLabel}。`
}

function buildWeightInterpretation(percentileInfo, weightChange) {
  const percentile = percentileInfo.percentile
  const levelLabel = getGrowthLevelLabel(percentile)
  const change = Number(weightChange)
  const trendText = change > 0
    ? `最近一次比上次增加约 ${weightChange}kg，体重曲线在继续向上。`
    : '最近两次体重变化不明显，建议结合食量、精神状态和连续记录一起看。'

  if (percentile <= 3) {
    return `体重目前大约在 ${percentileInfo.percentileText}，属于同龄儿童里偏低的位置。通俗理解是体重储备相对少一些，可以重点关注奶量/饭量、蛋白质和能量摄入，以及近期是否生病影响进食。${trendText}`
  }

  if (percentile <= 15) {
    return `体重目前大约在 ${percentileInfo.percentileText}，整体略偏轻，但如果精神状态好、曲线能稳定跟着自己的轨道往上走，通常比单次数字更重要。${trendText}`
  }

  if (percentile < 85) {
    return `体重目前大约在 ${percentileInfo.percentileText}，处在比较常见的正常范围。继续保持规律饮食和足够活动，重点看后续曲线是否平稳。${trendText}`
  }

  return `体重目前大约在 ${percentileInfo.percentileText}，属于${levelLabel}。这不一定代表不好，但建议留意体重增长速度是否明显快于身高/身长增长，辅食尽量少糖少油，保持均衡。${trendText}`
}

function getGrowthData(babyId) {
  const state = getState()
  const baby = decorateBaby(state.babies.find(item => item.id === babyId))
  const records = (state.growthRecords[babyId] || []).slice().sort((a, b) => new Date(a.measuredDate) - new Date(b.measuredDate))
  const latest = records[records.length - 1]
  const previous = records[records.length - 2]
  const heightChange = previous ? (latest.height - previous.height).toFixed(1) : '0.0'
  const weightChange = previous ? (latest.weight - previous.weight).toFixed(1) : '0.0'
  const percentileInfo = latest ? getPercentileInfo(baby, latest) : {
    percentileText: 'P50 分位',
    percentile: 50,
    measureLabel: '身高'
  }
  const weightPercentileInfo = latest ? getPercentileInfo(baby, latest, 'weight') : {
    percentileText: 'P50 分位',
    percentile: 50,
    measureLabel: '体重'
  }
  const measureLabel = percentileInfo.measureLabel
  const heightChartData = buildHeightChartData(baby, records)
  const weightChartData = buildWeightChartData(baby, records)
  if (heightChartData) heightChartData.percentileText = percentileInfo.percentileText
  if (weightChartData) weightChartData.percentileText = weightPercentileInfo.percentileText
  const interpretation = latest
    ? `${buildGrowthInterpretation(measureLabel, percentileInfo, heightChange, weightChange)}\n\n${buildWeightInterpretation(weightPercentileInfo, weightChange)}`
    : '先记录一条生长数据，我们会按照世卫组织儿童生长标准生成更准确的趋势解读。'
  return {
    baby,
    latestRecord: latest ? { ...latest, percentile: percentileInfo.percentileText, weightPercentile: weightPercentileInfo.percentileText } : null,
    change: { heightChange, weightChange },
    records,
    chartData: heightChartData,
    chartList: [heightChartData, weightChartData].filter(Boolean),
    measureLabel,
    analysis: interpretation,
    recommendationCards: latest ? getGrowthRecommendedRecipes(baby, state) : []
  }
}

function addGrowthRecord(babyId, payload) {
  const state = getState()
  const list = state.growthRecords[babyId] || []
  list.push({
    id: `g${Date.now()}`,
    measuredDate: payload.measuredDate,
    height: Number(payload.height),
    weight: Number(payload.weight)
  })
  state.growthRecords[babyId] = list
  setState(state)
  return getGrowthData(babyId)
}

function getWeeklyPlan(babyId, requiredRecipeIds = []) {
  const state = getState()
  ensureRecommendationSeeds(state)
  const confirmedPlan = getConfirmedWeeklyPlan(babyId, state)
  if (!requiredRecipeIds.length && confirmedPlan) {
    state.weeklyPlans[babyId] = confirmedPlan
    setState(state)
    return confirmedPlan
  }
  if (!state.weeklyPlans[babyId] || requiredRecipeIds.length) {
    state.weeklyPlans[babyId] = generateWeeklyPlanEntries(state, babyId, false, requiredRecipeIds)
    setState(state)
  }
  return clone(state.weeklyPlans[babyId])
}

function refreshWeeklyPlan(babyId, requiredRecipeIds = []) {
  const state = getState()
  state.weeklyPlans[babyId] = generateWeeklyPlanEntries(state, babyId, true, requiredRecipeIds)
  delete state.confirmedWeeklyPlans[babyId]
  setState(state)
  return clone(state.weeklyPlans[babyId])
}

const WEEKLY_MEAL_KEYS = ['breakfast', 'lunch', 'dinner']

function uniqueRecipeIds(recipeIds) {
  const seen = new Set()
  return (recipeIds || []).filter(id => {
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function pickSpacedRecipeId(candidates, usageMap, lastDayMap, dayIndex, usedToday, slotIndex) {
  const ranked = (candidates || []).filter(Boolean).map((id, index) => ({
    id,
    index,
    usage: usageMap[id] || 0,
    lastDay: lastDayMap[id]
  }))
  if (!ranked.length) return ''

  const spaced = ranked.filter(item => !usedToday.has(item.id) && (item.lastDay === undefined || dayIndex - item.lastDay >= 3))
  const noSameDay = ranked.filter(item => !usedToday.has(item.id))
  const pool = spaced.length ? spaced : (noSameDay.length ? noSameDay : ranked)
  return pool.sort((left, right) => {
    if (left.usage !== right.usage) return left.usage - right.usage
    const leftRotation = (left.index - slotIndex + ranked.length * 100) % ranked.length
    const rightRotation = (right.index - slotIndex + ranked.length * 100) % ranked.length
    return leftRotation - rightRotation
  })[0].id
}

function buildSpacedWeeklyRecipeIds(allRecipeIds, requiredRecipeIds) {
  const sourceIds = uniqueRecipeIds(allRecipeIds)
  const requiredQueue = uniqueRecipeIds(requiredRecipeIds).filter(id => sourceIds.includes(id))
  const usageMap = {}
  const lastDayMap = {}
  const result = []

  for (let slotIndex = 0; slotIndex < 21; slotIndex += 1) {
    const dayIndex = Math.floor(slotIndex / 3)
    const usedToday = new Set(result.slice(dayIndex * 3, slotIndex))
    let recipeId = ''

    if (requiredQueue.length) {
      recipeId = pickSpacedRecipeId(requiredQueue, usageMap, lastDayMap, dayIndex, usedToday, slotIndex)
      const requiredIndex = requiredQueue.indexOf(recipeId)
      if (requiredIndex >= 0) requiredQueue.splice(requiredIndex, 1)
    }

    if (!recipeId) {
      recipeId = pickSpacedRecipeId(sourceIds, usageMap, lastDayMap, dayIndex, usedToday, slotIndex)
    }

    if (!recipeId) break
    result.push(recipeId)
    usageMap[recipeId] = (usageMap[recipeId] || 0) + 1
    lastDayMap[recipeId] = dayIndex
  }

  return result
}

function generateWeeklyPlanEntries(state, babyId, reverse, requiredRecipeIds = []) {
  const today = new Date()
  const start = new Date(today)
  const weekday = start.getDay() || 7
  start.setDate(start.getDate() - weekday + 1)
  const availableIds = state.recipes.map(item => item.id).filter(Boolean)
  const requiredIds = uniqueRecipeIds(requiredRecipeIds).filter(id => availableIds.includes(id))
  const baseIds = availableIds.filter(id => !requiredIds.includes(id))
  const orderedIds = requiredIds.concat(reverse ? baseIds.reverse() : baseIds)
  const weeklyIds = buildSpacedWeeklyRecipeIds(orderedIds, requiredIds)
  const plan = Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    const baseIndex = index * 3
    return {
      dayLabel: getWeekLabel(index),
      date: formatDate(current),
      shortDate: getShortDate(current),
      breakfast: normalizeRecipe(weeklyIds[baseIndex], state),
      lunch: normalizeRecipe(weeklyIds[baseIndex + 1], state),
      dinner: normalizeRecipe(weeklyIds[baseIndex + 2], state)
    }
  })

  return plan
}

function buildShoppingList(babyId) {
  const state = getState()
  confirmWeeklyPlan(babyId, state)
  const plan = getWeeklyPlan(babyId)
  const bucket = {}
  plan.forEach(day => {
    ;[day.breakfast, day.lunch, day.dinner].forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        bucket[ingredient.name] = bucket[ingredient.name] || []
        bucket[ingredient.name].push(ingredient.quantity)
      })
    })
  })
  return Object.keys(bucket).map(name => ({
    ingredient: name,
    summary: bucket[name].slice(0, 2).join(' + ')
  }))
}

function getWeekKey(date = new Date()) {
  const start = new Date(date)
  const weekday = start.getDay() || 7
  start.setDate(start.getDate() - weekday + 1)
  return formatDate(start)
}

function getTodayPlanIndex(date = new Date()) {
  return (date.getDay() || 7) - 1
}

function getConfirmedWeeklyPlan(babyId, snapshot) {
  const state = snapshot || getState()
  const record = (state.confirmedWeeklyPlans || {})[babyId]
  if (!record || record.weekKey !== getWeekKey() || !record.plan || !record.plan.length) {
    return null
  }
  return clone(record.plan)
}

function applyConfirmedWeeklyPlanToTodaySeed(state, babyId) {
  const plan = getConfirmedWeeklyPlan(babyId, state)
  if (!plan) return state
  const todayPlan = plan[getTodayPlanIndex()]
  if (!todayPlan) return state
  state.todayRecommendationSeed[babyId] = {
    ...(state.todayRecommendationSeed[babyId] || {}),
    breakfast: todayPlan.breakfast && todayPlan.breakfast.id,
    lunch: todayPlan.lunch && todayPlan.lunch.id,
    dinner: todayPlan.dinner && todayPlan.dinner.id,
    suggestions: plan
      .flatMap(day => [day.breakfast, day.lunch, day.dinner])
      .filter(Boolean)
      .map(item => item.id)
      .filter(Boolean)
      .slice(0, 3)
  }
  setState(state)
  return state
}

function confirmWeeklyPlan(babyId, snapshot) {
  const state = snapshot || getState()
  const plan = state.weeklyPlans[babyId] && state.weeklyPlans[babyId].length
    ? state.weeklyPlans[babyId]
    : generateWeeklyPlanEntries(state, babyId, false, [])
  state.weeklyPlans[babyId] = plan
  state.confirmedWeeklyPlans[babyId] = {
    weekKey: getWeekKey(),
    confirmedAt: new Date().toISOString(),
    plan: clone(plan)
  }
  applyConfirmedWeeklyPlanToTodaySeed(state, babyId)
  setState(state)
  return clone(plan)
}

function swapWeeklyPlanDay(babyId, dayIndex) {
  const state = getState()
  const plan = state.weeklyPlans[babyId] && state.weeklyPlans[babyId].length
    ? state.weeklyPlans[babyId]
    : generateWeeklyPlanEntries(state, babyId, false, [])
  const currentIds = new Set()
  ;(plan || []).forEach((day, index) => {
    if (index === dayIndex) return
    WEEKLY_MEAL_KEYS.forEach(key => {
      if (day[key] && day[key].id) currentIds.add(day[key].id)
    })
  })

  const availableIds = state.recipes
    .map(item => item.id)
    .filter(id => id && !currentIds.has(id))
  const fallbackIds = state.recipes.map(item => item.id).filter(Boolean)
  const seedIds = availableIds.length >= 3 ? availableIds : fallbackIds
  const offset = (Date.now() + dayIndex * 7) % Math.max(seedIds.length, 1)
  const rotated = seedIds.slice(offset).concat(seedIds.slice(0, offset))
  const nextIds = buildSpacedWeeklyRecipeIds(rotated, []).slice(0, 3)
  const target = plan[dayIndex]
  if (!target || nextIds.length < 3) return clone(plan)

  target.breakfast = normalizeRecipe(nextIds[0], state)
  target.lunch = normalizeRecipe(nextIds[1], state)
  target.dinner = normalizeRecipe(nextIds[2], state)
  state.weeklyPlans[babyId] = plan
  delete state.confirmedWeeklyPlans[babyId]
  setState(state)
  return clone(plan)
}

function saveBaby(payload) {
  const state = getState()
  let activeId = payload.id
  if (payload.id) {
    state.babies = state.babies.map(item => item.id === payload.id ? { ...item, ...payload } : item)
  } else {
    activeId = `baby-${Date.now()}`
    state.babies.push({
      ...payload,
      id: activeId,
      active: state.babies.length === 0
    })
  }
  if (payload.active) {
    state.babies = state.babies.map(item => ({ ...item, active: item.id === activeId }))
  }
  setState(state)
  return clone(state.babies)
}

function ensureRecommendationSeeds(state) {
  const targetState = state || getState()
  const recipeIds = targetState.recipes.map(item => item.id)
  if (!recipeIds.length) {
    return targetState
  }

  targetState.babies.forEach((baby, index) => {
    if (!targetState.todayRecommendationSeed[baby.id]) {
      targetState.todayRecommendationSeed[baby.id] = {
        breakfast: recipeIds[(index * 3) % recipeIds.length],
        lunch: recipeIds[(index * 3 + 1) % recipeIds.length],
        dinner: recipeIds[(index * 3 + 2) % recipeIds.length],
        suggestions: recipeIds.slice(0, 3)
      }
    }
  })

  return targetState
}

function syncRemoteUser(user) {
  const state = getState()
  const remoteAvatar = user.avatarImage || user.avatar_url || user.avatarUrl || ''
  const currentAvatar = normalizeAvatar(state.user.avatarImage || state.user.avatarUrl, '/assets/avatars/mom-q.svg')
  const avatarImage = normalizeAvatar(remoteAvatar, currentAvatar)
  state.user = {
    ...state.user,
    id: user.id || state.user.id,
    nickname: user.nickname || state.user.nickname,
    avatarUrl: avatarImage,
    avatarImage,
    bio: user.bio || state.user.bio || '记录宝宝每一口成长的小小营养官'
  }
  state.isLoggedIn = true
  setState(state)
  return clone(state.user)
}

function syncRemoteBabies(babiesList) {
  const state = getState()
  const fallbackCurrent = getCurrentBaby(state)
  const hasActive = babiesList.some(item => item.active)
  state.babies = babiesList.map((item, index) => ({
    ...item,
    active: hasActive ? item.active : (fallbackCurrent ? item.id === fallbackCurrent.id : index === 0)
  }))
  ensureRecommendationSeeds(state)
  setState(state)
  return clone(state.babies)
}

function syncRemoteRecipes(recipeList) {
  const state = getState()
  state.recipes = recipeList
  ensureRecommendationSeeds(state)
  setState(state)
  return clone(state.recipes)
}

function syncRemoteGrowthRecords(babyId, records) {
  const state = getState()
  state.growthRecords[babyId] = records
  setState(state)
  return clone(records)
}

function syncCollections(recipeIds) {
  const state = getState()
  state.collections = recipeIds.slice()
  setState(state)
  return clone(state.collections)
}

function syncMadeCount(count) {
  const state = getState()
  state.madeRecipes = Array.from({ length: count }).map((_, index) => ({
    recipeId: `remote-${index}`,
    babyId: 'remote',
    date: formatDate(new Date())
  }))
  setState(state)
  return count
}

function toggleElderMode(value) {
  const state = getState()
  state.user.elderMode = value
  setState(state)
  return value
}

function getCurrentFamily() {
  const state = getState()
  return {
    family: clone(state.family || {}),
    myRole: (state.family && state.family.myRole) || 'owner',
    member: (state.familyMembers || []).find(item => item.user && item.user.id === state.user.id) || null,
    members: clone(state.familyMembers || [])
  }
}

function syncRemoteFamily(payload = {}) {
  const state = getState()
  const family = payload.family || state.family || {}
  const members = payload.members || state.familyMembers || []
  state.family = {
    ...state.family,
    ...family,
    myRole: payload.myRole || payload.my_role || family.myRole || state.family?.myRole || 'owner'
  }
  state.familyMembers = members.map(item => ({
    ...item,
    user: item.user || item.users || item.member_user || item.memberUser || {}
  }))
  setState(state)
  return getCurrentFamily()
}

function createFamilyInvite(payload = {}) {
  return {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    role_to_grant: payload.role || 'editor',
    relation: payload.relation || '',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

function joinFamilyByInvite() {
  return getCurrentFamily()
}

function updateFamilyName(name) {
  const state = getState()
  state.family = {
    ...(state.family || {}),
    name: String(name || '').trim() || '我的家庭'
  }
  setState(state)
  return getCurrentFamily()
}

function saveUserProfile(payload = {}) {
  const state = getState()
  state.user = {
    ...state.user,
    nickname: payload.nickname || state.user.nickname,
    bio: payload.bio !== undefined ? payload.bio : state.user.bio,
    avatarImage: payload.avatarImage || state.user.avatarImage
  }
  setState(state)
  return clone(state.user)
}

function normalizeUserRecipePayload(payload = {}) {
  const minAgeMonths = Number(payload.minAgeMonths || 6)
  const maxAgeMonths = Number(payload.maxAgeMonths || Math.max(minAgeMonths, 72))
  return {
    id: payload.id || `user-recipe-${Date.now()}`,
    name: payload.name,
    description: payload.description || '来自用户记录的宝宝食谱。',
    imageText: payload.imageText || '🥣',
    minAgeMonths,
    maxAgeMonths,
    ageLabel: `${minAgeMonths}月龄+`,
    cookingTime: Number(payload.cookingTime || 20),
    tags: payload.tags || ['自制食谱'],
    primaryTag: (payload.tags && payload.tags[0]) || '自制食谱',
    allergens: payload.allergens || [],
    ingredients: payload.ingredients || [],
    steps: payload.steps || [],
    tips: payload.tips || '根据宝宝接受度调整颗粒大小和调味。',
    nutrition: payload.nutritionInfo || '建议搭配蔬菜、优质蛋白和主食，保持均衡。',
    rating: 4.8,
    madeCount: 0,
    isPublic: payload.isPublic !== false,
    auditStatus: payload.isPublic === false ? 'private' : 'approved',
    authorUserId: getState().user.id,
    isMine: true,
    videoLabel: '查看完整做法',
    createdAt: new Date().toISOString()
  }
}

function createRecipe(payload = {}) {
  const state = getState()
  const recipe = normalizeUserRecipePayload(payload)
  recipe.authorUserId = state.user.id
  state.recipes.unshift(recipe)
  setState(state)
  return buildRecipeCard(recipe, state)
}

function updateRecipeVisibility(recipeId, isPublic) {
  const state = getState()
  let updated = null
  state.recipes = state.recipes.map(item => {
    if (item.id !== recipeId) return item
    updated = {
      ...item,
      isPublic,
      auditStatus: isPublic ? 'approved' : 'private'
    }
    return updated
  })
  setState(state)
  return updated ? buildRecipeCard(updated, state) : null
}

function updateRecipe(recipeId, payload = {}) {
  const state = getState()
  let updated = null
  state.recipes = state.recipes.map(item => {
    if (item.id !== recipeId) return item
    updated = {
      ...normalizeUserRecipePayload({
        ...payload,
        id: recipeId
      }),
      authorUserId: item.authorUserId || state.user.id,
      createdAt: item.createdAt || item.created_at || new Date().toISOString()
    }
    return updated
  })
  setState(state)
  return updated ? buildRecipeCard(updated, state) : null
}

module.exports = {
  initialize,
  setState,
  getToken,
  setToken,
  clearToken,
  login,
  getOverview,
  getCurrentBaby,
  getTodayRecommendation,
  swapMeal,
  getRecipeById,
  toggleCollection,
  markRecipeMade,
  filterRecipes,
  getCollectedRecipes,
  getMadeRecipes,
  getCreatedRecipes,
  switchBaby,
  getGrowthData,
  addGrowthRecord,
  getWeeklyPlan,
  refreshWeeklyPlan,
  swapWeeklyPlanDay,
  confirmWeeklyPlan,
  getConfirmedWeeklyPlan,
  applyConfirmedWeeklyPlanToTodaySeed,
  buildShoppingList,
  saveBaby,
  syncRemoteUser,
  syncRemoteBabies,
  syncRemoteRecipes,
  syncRemoteGrowthRecords,
  syncCollections,
  syncMadeCount,
  getCurrentFamily,
  syncRemoteFamily,
  createFamilyInvite,
  joinFamilyByInvite,
  updateFamilyName,
  toggleElderMode,
  saveUserProfile,
  createRecipe,
  updateRecipe,
  updateRecipeVisibility,
  getState,
  decorateBaby
}
