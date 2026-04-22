const store = require('./store')

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api'

function getApiBaseUrl() {
  return wx.getStorageSync('api_base_url') || DEFAULT_API_BASE_URL
}

function request(method, path, data, { auth = true } = {}) {
  const token = store.getToken()
  const headers = {
    'Content-Type': 'application/json'
  }

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}${path}`,
      method,
      data,
      header: headers,
      success: (response) => {
        const payload = response.data || {}
        if (response.statusCode >= 200 && response.statusCode < 300 && payload.code === 0) {
          resolve(payload.data)
          return
        }

        reject(new Error(payload.message || 'Request failed'))
      },
      fail: reject
    })
  })
}

function withFallback(remoteTask, localTask) {
  return remoteTask().catch(() => localTask())
}

function mapGenderFromDb(gender) {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return gender || '男'
}

function mapBaby(record) {
  return {
    id: record.id,
    nickname: record.nickname,
    gender: mapGenderFromDb(record.gender),
    birthDate: record.birth_date,
    allergies: record.allergies || [],
    dietaryPreferences: record.dietary_preferences || [],
    avatarImage: record.gender === 'female' ? '/assets/avatars/girl-q.svg' : '/assets/avatars/boy-q.svg',
    active: !!record.is_active
  }
}

function normalizeRecipe(record, index = 0) {
  const emojiPool = ['🍅', '🥦', '🎃', '🥣', '🥕', '🥬', '🧀', '🥑']
  const tags = record.tags || []
  const ingredients = Array.isArray(record.ingredients) ? record.ingredients : []
  const steps = Array.isArray(record.steps)
    ? record.steps.map(item => typeof item === 'string' ? item : item.description || `步骤 ${item.step || ''}`)
    : []

  return {
    id: record.id,
    name: record.name,
    description: record.description || '营养搭配更适合宝宝当前阶段。',
    imageText: record.image_text || record.imageText || emojiPool[index % emojiPool.length],
    minAgeMonths: record.min_age_months,
    maxAgeMonths: record.max_age_months,
    ageLabel: `${record.min_age_months}月龄+`,
    cookingTime: record.cooking_time,
    difficulty: record.difficulty || '简单',
    tags,
    primaryTag: tags[0] || '',
    allergens: record.allergens || [],
    ingredients: ingredients.map(item => ({
      name: item.name || '食材',
      quantity: item.quantity ? `${item.quantity}${item.unit || ''}` : (item.amount || item.unit || '适量')
    })),
    steps,
    tips: record.tips || '少量多次尝试，观察宝宝接受度。',
    nutrition: record.nutrition_info || '注重均衡摄入蛋白质、碳水与维生素。',
    rating: Number(record.rating || 4.8),
    madeCount: Number(record.times_made || 0),
    videoLabel: '查看完整视频'
  }
}

function isRemoteEnabled() {
  return !!store.getToken()
}

function syncProfileAndBabies(profile, babies) {
  if (profile) {
    store.syncRemoteUser(profile)
  }
  if (babies) {
    store.syncRemoteBabies(babies)
  }
}

async function syncRemoteCollections() {
  const data = await request('GET', '/recipe/collections/list')
  store.syncCollections(data.recipe_ids || [])
  return data.recipe_ids || []
}

function login() {
  const remoteTask = async () => {
    let authData

    try {
      const loginResult = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      authData = await request('POST', '/auth/wechat-login', {
        code: loginResult.code,
        userInfo: {
          nickName: '妈妈小厨'
        }
      }, { auth: false })
    } catch (error) {
      authData = await request('POST', '/auth/dev-login', {
        openid: `dev-openid-${Date.now()}`,
        nickname: '妈妈小厨'
      }, { auth: false })
    }

    store.setToken(authData.token)
    store.syncRemoteUser({
      id: authData.user_id,
      nickname: authData.nickname
    })

    const [profile, babiesData] = await Promise.all([
      request('GET', '/auth/profile'),
      request('GET', '/baby/list')
    ])

    syncProfileAndBabies(profile, (babiesData.babies || []).map(mapBaby))
    return store.getState().user
  }

  return withFallback(
    remoteTask,
    () => Promise.resolve(store.login())
  )
}

function getOverview() {
  const remoteTask = async () => {
    const [profile, babiesData, collectionIds, madeCountData] = await Promise.all([
      request('GET', '/auth/profile'),
      request('GET', '/baby/list'),
      syncRemoteCollections(),
      request('GET', '/recipe/made/count')
    ])

    syncProfileAndBabies(profile, (babiesData.babies || []).map(mapBaby))
    store.syncCollections(collectionIds)
    store.syncMadeCount(madeCountData.total || 0)
    const currentBaby = store.getCurrentBaby(store.getState())

    if (currentBaby) {
      try {
        const todayData = await request('GET', `/recommendation/today?baby_id=${encodeURIComponent(currentBaby.id)}`)
        const state = store.getState()
        const normalizedRecipes = []
        const breakfast = todayData.breakfast ? normalizeRecipe(todayData.breakfast, 0) : null
        const lunch = todayData.lunch ? normalizeRecipe(todayData.lunch, 1) : null
        const dinner = todayData.dinner ? normalizeRecipe(todayData.dinner, 2) : null
        const suggestions = (todayData.suggestions || []).map((item, index) => normalizeRecipe(item, index + 3))
        if (breakfast) normalizedRecipes.push(breakfast)
        if (lunch) normalizedRecipes.push(lunch)
        if (dinner) normalizedRecipes.push(dinner)
        normalizedRecipes.push(...suggestions)
        const merged = mergeRecipes(state.recipes, normalizedRecipes)
        store.syncRemoteRecipes(merged)
        state.todayRecommendationSeed[currentBaby.id] = {
          breakfast: breakfast?.id,
          lunch: lunch?.id,
          dinner: dinner?.id,
          suggestions: suggestions.map(item => item.id)
        }
        state.collections = collectionIds
        store.setState(state)
      } catch (error) {
        // keep local fallback
      }
    }

    return store.getOverview()
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.getOverview())
  }

  return withFallback(remoteTask, () => Promise.resolve(store.getOverview()))
}

function translateRecipeFilters(params = {}) {
  const query = {
    page: 1,
    limit: 50
  }

  const ageMap = {
    '6-8月': [6, 8],
    '8-10月': [8, 10],
    '10-12月': [10, 12],
    '1-2岁': [12, 24],
    '2-3岁': [24, 36],
    '3岁+': [36, 72]
  }

  if (params.keyword) {
    query.keyword = params.keyword
  }

  if (params.ageRange && ageMap[params.ageRange]) {
    const [ageMin, ageMax] = ageMap[params.ageRange]
    query.ageMin = ageMax
    query.ageMax = ageMin
  }

  if (params.tag && params.tag !== '全部') {
    query.tags = params.tag
  }

  return query
}

function getRecipes(params) {
  const remoteTask = async () => {
    const data = await request('GET', `/recipe/list?${toQueryString(translateRecipeFilters(params))}`)
    const normalized = (data.recipes || []).map(normalizeRecipe)
    if (normalized.length) {
      store.syncRemoteRecipes(normalized)
    }
    return normalized.length ? normalized : store.filterRecipes(params)
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.filterRecipes(params))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.filterRecipes(params)))
}

function getMyRecipes(type) {
  const remoteTask = async () => {
    if (type === 'collection') {
      const data = await request('GET', '/recipe/collections/recipes')
      const normalized = (data.recipes || []).map(normalizeRecipe)
      if (normalized.length) {
        store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, normalized))
      }
      return normalized.length ? normalized : store.getCollectedRecipes()
    }

    if (type === 'made') {
      const data = await request('GET', '/recipe/made/list')
      const normalized = (data.recipes || []).map(normalizeRecipe)
      if (normalized.length) {
        store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, normalized))
      }
      return normalized.length ? normalized : store.getMadeRecipes()
    }

    return getRecipes({})
  }

  const localTask = () => {
    if (type === 'collection') return Promise.resolve(store.getCollectedRecipes())
    if (type === 'made') return Promise.resolve(store.getMadeRecipes())
    return Promise.resolve(store.filterRecipes({}))
  }

  if (!isRemoteEnabled()) {
    return localTask()
  }

  return withFallback(remoteTask, localTask)
}

function getRecipeDetail(recipeId) {
  const remoteTask = async () => {
    const data = await request('GET', `/recipe/${recipeId}`)
    const normalized = {
      ...normalizeRecipe(data.recipe),
      isCollected: !!data.is_collected,
      madeCount: Number(data.times_user_made || data.recipe.times_made || 0)
    }
    const state = store.getState()
    store.syncRemoteRecipes(mergeRecipes(state.recipes, [normalized]))
    return normalized
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.getRecipeById(recipeId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.getRecipeById(recipeId)))
}

function swapMeal(babyId, mealType) {
  const remoteTask = async () => {
    const today = store.getTodayRecommendation(babyId)
    const excludedRecipeIds = ['breakfast', 'lunch', 'dinner']
      .map(key => today[key] && today[key].id)
      .filter(Boolean)

    const data = await request('POST', '/recommendation/swap-meal', {
      baby_id: babyId,
      meal_type: mealType,
      exclude_recipe_ids: excludedRecipeIds
    })
    const normalized = normalizeRecipe(data.new_recipe)
    const state = store.getState()
    store.syncRemoteRecipes(mergeRecipes(state.recipes, [normalized]))
    state.todayRecommendationSeed[babyId] = state.todayRecommendationSeed[babyId] || {}
    state.todayRecommendationSeed[babyId][mealType] = normalized.id
    store.setState(state)
    return store.getTodayRecommendation(babyId, store.getState())
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.swapMeal(babyId, mealType))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.swapMeal(babyId, mealType)))
}

function toggleCollection(recipeId) {
  const remoteTask = async () => {
    const current = store.getRecipeById(recipeId)
    const action = current && current.isCollected ? 'remove' : 'add'
    const data = await request('POST', `/recipe/${recipeId}/collect`, { action })
    const collectionIds = await syncRemoteCollections()
    const state = store.getState()
    store.syncCollections(collectionIds)
    return data.is_collected
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.toggleCollection(recipeId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.toggleCollection(recipeId)))
}

function markRecipeMade(recipeId, babyId) {
  const remoteTask = async () => {
    await request('POST', `/recipe/${recipeId}/mark-made`, {
      baby_id: babyId
    })
    store.markRecipeMade(recipeId, babyId)
    const current = store.getRecipeById(recipeId)
    if (current) {
      const state = store.getState()
      const merged = mergeRecipes(state.recipes, [{
        ...current,
        madeCount: (current.madeCount || 0) + 1
      }])
      store.syncRemoteRecipes(merged)
    }
    return true
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.markRecipeMade(recipeId, babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.markRecipeMade(recipeId, babyId)))
}

function switchBaby(babyId) {
  const remoteTask = async () => {
    const state = store.getState()
    const target = state.babies.find(item => item.id === babyId)
    if (!target) {
      return store.switchBaby(babyId)
    }

    await request('PUT', `/baby/${babyId}`, {
      nickname: target.nickname,
      gender: target.gender,
      birthDate: target.birthDate,
      allergies: target.allergies,
      dietaryPreferences: target.dietaryPreferences,
      isActive: true
    })

    const babiesData = await request('GET', '/baby/list')
    store.syncRemoteBabies((babiesData.babies || []).map(mapBaby))
    return store.decorateBaby(store.getCurrentBaby(store.getState()))
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.switchBaby(babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.switchBaby(babyId)))
}

function getGrowthData(babyId) {
  const remoteTask = async () => {
    const data = await request('GET', `/growth-record/history?baby_id=${encodeURIComponent(babyId)}&limit=20`)
    const records = (data.records || []).map(item => ({
      id: item.id,
      measuredDate: item.measured_date,
      height: Number(item.height),
      weight: Number(item.weight)
    }))
    store.syncRemoteGrowthRecords(babyId, records)
    return store.getGrowthData(babyId)
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.getGrowthData(babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.getGrowthData(babyId)))
}

function addGrowthRecord(babyId, payload) {
  const remoteTask = async () => {
    await request('POST', '/growth-record/add', {
      baby_id: babyId,
      measured_date: payload.measuredDate,
      height: Number(payload.height),
      weight: Number(payload.weight)
    })
    return getGrowthData(babyId)
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.addGrowthRecord(babyId, payload))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.addGrowthRecord(babyId, payload)))
}

function getWeeklyPlan(babyId) {
  const remoteTask = async () => {
    const data = await request('POST', '/weekly-plan/generate', {
      baby_id: babyId,
      variant: 'default'
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    const state = store.getState()
    store.syncRemoteRecipes(mergeRecipes(state.recipes, flattenPlanRecipes(normalizedPlan)))
    state.weeklyPlans[babyId] = normalizedPlan
    store.setState(state)
    return normalizedPlan
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.getWeeklyPlan(babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.getWeeklyPlan(babyId)))
}

function refreshWeeklyPlan(babyId) {
  const remoteTask = async () => {
    const data = await request('POST', '/weekly-plan/generate', {
      baby_id: babyId,
      variant: String(Date.now())
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    const state = store.getState()
    store.syncRemoteRecipes(mergeRecipes(state.recipes, flattenPlanRecipes(normalizedPlan)))
    state.weeklyPlans[babyId] = normalizedPlan
    store.setState(state)
    return normalizedPlan
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.refreshWeeklyPlan(babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.refreshWeeklyPlan(babyId)))
}

function buildShoppingList(babyId) {
  const remoteTask = async () => {
    const data = await request('POST', '/weekly-plan/shopping-list', {
      baby_id: babyId,
      variant: 'default'
    })
    return data.shopping_list || []
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.buildShoppingList(babyId))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.buildShoppingList(babyId)))
}

function saveBaby(payload) {
  const remoteTask = async () => {
    const requestData = {
      nickname: payload.nickname,
      gender: payload.gender,
      birthDate: payload.birthDate,
      allergies: payload.allergies || [],
      dietaryPreferences: payload.dietaryPreferences || [],
      isActive: payload.active !== false
    }

    if (payload.id) {
      await request('PUT', `/baby/${payload.id}`, requestData)
    } else {
      await request('POST', '/baby/create', requestData)
    }

    const babiesData = await request('GET', '/baby/list')
    return store.syncRemoteBabies((babiesData.babies || []).map(mapBaby))
  }

  if (!isRemoteEnabled()) {
    return Promise.resolve(store.saveBaby(payload))
  }

  return withFallback(remoteTask, () => Promise.resolve(store.saveBaby(payload)))
}

function toggleElderMode(value) {
  return Promise.resolve(store.toggleElderMode(value))
}

function saveUserProfile(payload) {
  return Promise.resolve(store.saveUserProfile(payload))
}

function toQueryString(params = {}) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

function mergeRecipes(existing, incoming) {
  const bucket = {}
  ;(existing || []).forEach(item => {
    if (item && item.id) bucket[item.id] = item
  })
  ;(incoming || []).forEach(item => {
    if (item && item.id) bucket[item.id] = {
      ...(bucket[item.id] || {}),
      ...item
    }
  })
  return Object.keys(bucket).map(key => bucket[key])
}

function normalizeWeeklyPlan(planItems) {
  return planItems.map((item, index) => ({
    dayLabel: item.dayLabel || item.day_label || `第${index + 1}天`,
    shortDate: (item.date || '').slice(5).replace('-', '/'),
    breakfast: normalizeRecipe(item.breakfast, index * 3),
    lunch: normalizeRecipe(item.lunch, index * 3 + 1),
    dinner: normalizeRecipe(item.dinner, index * 3 + 2)
  }))
}

function flattenPlanRecipes(plan) {
  const recipes = []
  ;(plan || []).forEach(day => {
    recipes.push(day.breakfast, day.lunch, day.dinner)
  })
  return recipes.filter(Boolean)
}

module.exports = {
  login,
  getOverview,
  getRecipes,
  getMyRecipes,
  getRecipeDetail,
  swapMeal,
  toggleCollection,
  markRecipeMade,
  switchBaby,
  getGrowthData,
  addGrowthRecord,
  getWeeklyPlan,
  refreshWeeklyPlan,
  buildShoppingList,
  saveBaby,
  saveUserProfile,
  toggleElderMode
}
