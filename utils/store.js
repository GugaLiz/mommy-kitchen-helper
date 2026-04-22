const { recipes, users, babies, growthRecords, dailyRecommendationTemplate } = require('./mock-data')
const { calculateAgeMonths, formatDate, getWeekLabel, getShortDate } = require('./format')
const { getPercentileInfo, buildHeightChartData } = require('./growth-standard')

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
    isLoggedIn: false
  }
}

function getState() {
  return wx.getStorageSync(STORAGE_KEY) || createInitialState()
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
  return {
    ...recipe,
    primaryTag: recipe.tags[0] || '',
    isCollected: targetState.collections.includes(recipe.id),
    madeTimes: targetState.madeRecipes.filter(item => item.recipeId === recipe.id).length
  }
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
  const today = currentBaby ? getTodayRecommendation(currentBaby.id, state) : {}
  return {
    user: clone(state.user),
    babies: clone(state.babies).map(item => decorateBaby(item)),
    currentBaby: currentBaby ? decorateBaby(currentBaby) : null,
    todayRecommendation: today,
    collectionsCount: state.collections.length,
    madeCount: state.madeRecipes.length
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
  const measureLabel = percentileInfo.measureLabel
  const interpretation = latest
    ? buildGrowthInterpretation(measureLabel, percentileInfo, heightChange, weightChange)
    : '先记录一条生长数据，我们会按照世卫组织儿童生长标准生成更准确的趋势解读。'
  return {
    baby,
    latestRecord: latest ? { ...latest, percentile: percentileInfo.percentileText } : null,
    change: { heightChange, weightChange },
    records,
    chartData: buildHeightChartData(baby, records),
    measureLabel,
    analysis: interpretation,
    recommendationCards: [buildRecipeCard(normalizeRecipe('recipe-4', state), state), buildRecipeCard(normalizeRecipe('recipe-5', state), state)]
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

function getWeeklyPlan(babyId) {
  const state = getState()
  ensureRecommendationSeeds(state)
  if (!state.weeklyPlans[babyId]) {
    state.weeklyPlans[babyId] = generateWeeklyPlanEntries(state, babyId)
    setState(state)
  }
  return clone(state.weeklyPlans[babyId])
}

function refreshWeeklyPlan(babyId) {
  const state = getState()
  state.weeklyPlans[babyId] = generateWeeklyPlanEntries(state, babyId, true)
  setState(state)
  return clone(state.weeklyPlans[babyId])
}

function generateWeeklyPlanEntries(state, babyId, reverse) {
  const today = new Date()
  const start = new Date(today)
  const weekday = start.getDay() || 7
  start.setDate(start.getDate() - weekday + 1)
  const ids = reverse ? state.recipes.map(item => item.id).reverse() : state.recipes.map(item => item.id)
  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    return {
      dayLabel: getWeekLabel(index),
      shortDate: getShortDate(current),
      breakfast: normalizeRecipe(ids[(index * 3) % ids.length], state),
      lunch: normalizeRecipe(ids[(index * 3 + 1) % ids.length], state),
      dinner: normalizeRecipe(ids[(index * 3 + 2) % ids.length], state)
    }
  })
}

function buildShoppingList(babyId) {
  const state = getState()
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
  state.user = {
    ...state.user,
    id: user.id || state.user.id,
    nickname: user.nickname || state.user.nickname,
    avatarUrl: user.avatar_url || user.avatarUrl || state.user.avatarUrl,
    avatarImage: user.avatarImage || state.user.avatarImage || '/assets/avatars/mom-q.svg',
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
  state.weeklyPlans = {}
  ensureRecommendationSeeds(state)
  setState(state)
  return clone(state.babies)
}

function syncRemoteRecipes(recipeList) {
  const state = getState()
  state.recipes = recipeList
  state.weeklyPlans = {}
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
  switchBaby,
  getGrowthData,
  addGrowthRecord,
  getWeeklyPlan,
  refreshWeeklyPlan,
  buildShoppingList,
  saveBaby,
  syncRemoteUser,
  syncRemoteBabies,
  syncRemoteRecipes,
  syncRemoteGrowthRecords,
  syncCollections,
  syncMadeCount,
  toggleElderMode,
  saveUserProfile,
  getState,
  decorateBaby
}
