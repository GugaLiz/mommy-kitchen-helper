const store = require('./store')
const { isPersistableAvatar } = require('./avatar')

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3333/api'
const MOCK_CONFIG_KEY = 'mock_api_enabled'
const DEFAULT_MOCK_API_ENABLED = false
const DEV_LOGIN_CONFIG_KEY = 'dev_login_enabled'
const DEFAULT_DEV_LOGIN_ENABLED = false

function getApiBaseUrl() {
  return wx.getStorageSync('api_base_url') || DEFAULT_API_BASE_URL
}

function isMockEnabled() {
  const stored = wx.getStorageSync(MOCK_CONFIG_KEY)
  if (stored === '' || stored === undefined || stored === null) {
    return DEFAULT_MOCK_API_ENABLED
  }
  return !!stored
}

function setMockEnabled(enabled) {
  wx.setStorageSync(MOCK_CONFIG_KEY, !!enabled)
  return !!enabled
}

function isDevLoginEnabled() {
  const stored = wx.getStorageSync(DEV_LOGIN_CONFIG_KEY)
  if (stored === '' || stored === undefined || stored === null) {
    return DEFAULT_DEV_LOGIN_ENABLED
  }
  return !!stored
}

function setDevLoginEnabled(enabled) {
  wx.setStorageSync(DEV_LOGIN_CONFIG_KEY, !!enabled)
  return !!enabled
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
        console.log(`[api] ${method} ${path} -> ${response.statusCode}`, payload)
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

function mapGenderFromDb(gender) {
  if (gender === 'male') return '男'
  if (gender === 'female') return '女'
  return gender || '男'
}

function mapBaby(record) {
  const fallbackAvatar = record.gender === 'female' ? '/assets/avatars/girl-q.svg' : '/assets/avatars/boy-q.svg'
  const avatarImage = record.avatar_url || record.avatarUrl || ''
  return {
    id: record.id,
    nickname: record.nickname,
    gender: mapGenderFromDb(record.gender),
    birthDate: record.birth_date,
    allergies: record.allergies || [],
    dietaryPreferences: record.dietary_preferences || [],
    avatarImage: isPersistableAvatar(avatarImage) ? avatarImage : fallbackAvatar,
    active: !!record.is_active
  }
}

function normalizeRecipe(record, index = 0) {
  const emojiPool = ['🍅', '🥦', '🎃', '🥣', '🥕', '🥬', '🧀', '🥑']
  const tags = record.tags || []
  const ingredients = Array.isArray(record.ingredients) ? record.ingredients : []
  const currentUserId = (store.getState().user || {}).id
  const authorUserId = record.created_by_user_id || record.authorUserId || ''
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
    isPublic: record.is_public !== false,
    auditStatus: record.audit_status || (record.is_public === false ? 'private' : 'approved'),
    authorUserId,
    isMine: !!record.isMine || !!record.is_mine || (!!authorUserId && authorUserId === currentUserId),
    videoLabel: '查看完整视频'
  }
}

function runDataTask(remoteTask, localTask) {
  if (isMockEnabled()) {
    return localTask()
  }
  return remoteTask()
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

    if (isDevLoginEnabled()) {
      authData = await request('POST', '/auth/dev-login', {
        openid: 'dev-openid-fixed',
        nickname: '妈妈小厨'
      }, { auth: false })
    } else {
      const loginResult = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        })
      })

      authData = await request('POST', '/auth/wechat-login', {
        code: loginResult.code
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

  return runDataTask(remoteTask, () => Promise.resolve(store.login()))
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

    if (currentBaby && store.getConfirmedWeeklyPlan(currentBaby.id)) {
      store.applyConfirmedWeeklyPlanToTodaySeed(store.getState(), currentBaby.id)
    } else if (currentBaby) {
      const currentPlanData = await request('GET', `/weekly-plan/current?baby_id=${encodeURIComponent(currentBaby.id)}`)
      const currentPlan = normalizeWeeklyPlan(currentPlanData.weekly_recipes || [])

      if (currentPlan.length) {
        store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(currentPlan)))
        const currentState = store.getState()
        currentState.weeklyPlans[currentBaby.id] = currentPlan
        if (currentPlanData.is_confirmed) {
          currentState.confirmedWeeklyPlans[currentBaby.id] = {
            weekKey: getCurrentWeekKey(),
            confirmedAt: new Date().toISOString(),
            plan: currentPlan
          }
          store.setState(currentState)
          store.applyConfirmedWeeklyPlanToTodaySeed(store.getState(), currentBaby.id)
        } else {
          delete currentState.confirmedWeeklyPlans[currentBaby.id]
          store.setState(currentState)
        }
      } else {
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
        const nextState = store.getState()
        nextState.todayRecommendationSeed[currentBaby.id] = {
          breakfast: breakfast?.id,
          lunch: lunch?.id,
          dinner: dinner?.id,
          suggestions: suggestions.map(item => item.id)
        }
        store.setState(nextState)
      }
      const latestState = store.getState()
      latestState.collections = collectionIds
      store.setState(latestState)
    }

    return store.getOverview()
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.getOverview()))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.filterRecipes(params)))
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

    if (type === 'created') {
      const data = await request('GET', '/recipe/my/list')
      const normalized = (data.recipes || []).map(item => ({
        ...normalizeRecipe(item),
        isMine: true
      }))
      if (normalized.length) {
        store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, normalized))
      }
      return normalized
    }

    return getRecipes({})
  }

  const localTask = () => {
    if (type === 'collection') return Promise.resolve(store.getCollectedRecipes())
    if (type === 'made') return Promise.resolve(store.getMadeRecipes())
    if (type === 'created') return Promise.resolve(store.getCreatedRecipes())
    return Promise.resolve(store.filterRecipes({}))
  }

  return runDataTask(remoteTask, localTask)
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

  return runDataTask(remoteTask, () => Promise.resolve(store.getRecipeById(recipeId)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.swapMeal(babyId, mealType)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.toggleCollection(recipeId)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.markRecipeMade(recipeId, babyId)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.switchBaby(babyId)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.getGrowthData(babyId)))
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

  return runDataTask(remoteTask, () => Promise.resolve(store.addGrowthRecord(babyId, payload)))
}

function getWeeklyPlan(babyId, options = {}) {
  const existingPlan = (store.getState().weeklyPlans || {})[babyId]
  const confirmedPlan = store.getConfirmedWeeklyPlan(babyId)
  if (!options.requiredRecipeIds?.length && confirmedPlan && confirmedPlan.length) {
    return Promise.resolve(confirmedPlan)
  }
  if (!options.requiredRecipeIds?.length && existingPlan && existingPlan.length) {
    return Promise.resolve(existingPlan)
  }

  const remoteTask = async () => {
    if (!options.requiredRecipeIds?.length) {
      const currentData = await request('GET', `/weekly-plan/current?baby_id=${encodeURIComponent(babyId)}`)
      const currentPlan = normalizeWeeklyPlan(currentData.weekly_recipes || [])
      if (currentPlan.length) {
        store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(currentPlan)))
        const currentState = store.getState()
        currentState.weeklyPlans[babyId] = currentPlan
        if (currentData.is_confirmed) {
          currentState.confirmedWeeklyPlans[babyId] = {
            weekKey: getCurrentWeekKey(),
            confirmedAt: new Date().toISOString(),
            plan: currentPlan
          }
        } else {
          delete currentState.confirmedWeeklyPlans[babyId]
        }
        store.setState(currentState)
        return currentPlan
      }
    }

    const data = await request('POST', '/weekly-plan/generate', {
      baby_id: babyId,
      variant: 'default',
      required_recipe_ids: options.requiredRecipeIds || []
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(normalizedPlan)))
    const nextState = store.getState()
    nextState.weeklyPlans[babyId] = normalizedPlan
    if (data.is_confirmed) {
      nextState.confirmedWeeklyPlans[babyId] = {
        weekKey: getCurrentWeekKey(),
        confirmedAt: new Date().toISOString(),
        plan: normalizedPlan
      }
    } else {
      delete nextState.confirmedWeeklyPlans[babyId]
    }
    store.setState(nextState)
    return normalizedPlan
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.getWeeklyPlan(babyId, options.requiredRecipeIds || [])))
}

function refreshWeeklyPlan(babyId, options = {}) {
  const remoteTask = async () => {
    const data = await request('POST', '/weekly-plan/generate', {
      baby_id: babyId,
      variant: String(Date.now()),
      required_recipe_ids: options.requiredRecipeIds || []
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(normalizedPlan)))
    const nextState = store.getState()
    nextState.weeklyPlans[babyId] = normalizedPlan
    if (data.is_confirmed) {
      nextState.confirmedWeeklyPlans[babyId] = {
        weekKey: getCurrentWeekKey(),
        confirmedAt: new Date().toISOString(),
        plan: normalizedPlan
      }
    } else {
      delete nextState.confirmedWeeklyPlans[babyId]
    }
    store.setState(nextState)
    return normalizedPlan
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.refreshWeeklyPlan(babyId, options.requiredRecipeIds || [])))
}

function swapWeeklyPlanDay(babyId, dayIndex) {
  const remoteTask = async () => {
    const localPlan = store.swapWeeklyPlanDay(babyId, Number(dayIndex || 0))
    const data = await request('POST', '/weekly-plan/save', {
      baby_id: babyId,
      weekly_recipes: serializeWeeklyPlan(localPlan),
      is_confirmed: false
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(normalizedPlan)))
    const nextState = store.getState()
    nextState.weeklyPlans[babyId] = normalizedPlan
    delete nextState.confirmedWeeklyPlans[babyId]
    store.setState(nextState)
    return normalizedPlan
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.swapWeeklyPlanDay(babyId, Number(dayIndex || 0))))
}

function buildShoppingList(babyId) {
  const remoteTask = async () => {
    const data = await request('POST', '/weekly-plan/shopping-list', {
      baby_id: babyId,
      variant: 'default'
    })
    const normalizedPlan = normalizeWeeklyPlan(data.weekly_recipes || [])
    if (normalizedPlan.length) {
      store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, flattenPlanRecipes(normalizedPlan)))
      const nextState = store.getState()
      nextState.weeklyPlans[babyId] = normalizedPlan
      nextState.confirmedWeeklyPlans[babyId] = {
        weekKey: getCurrentWeekKey(),
        confirmedAt: new Date().toISOString(),
        plan: normalizedPlan
      }
      store.setState(nextState)
      store.applyConfirmedWeeklyPlanToTodaySeed(store.getState(), babyId)
    }
    return data.shopping_list || []
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.buildShoppingList(babyId)))
}

function saveBaby(payload) {
  const remoteTask = async () => {
    const requestData = {
      nickname: payload.nickname,
      gender: payload.gender,
      birthDate: payload.birthDate,
      allergies: payload.allergies || [],
      dietaryPreferences: payload.dietaryPreferences || [],
      avatarUrl: payload.avatarImage || null,
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

  return runDataTask(remoteTask, () => Promise.resolve(store.saveBaby(payload)))
}

function toggleElderMode(value) {
  return Promise.resolve(store.toggleElderMode(value))
}

function saveUserProfile(payload) {
  const remoteTask = async () => {
    const data = await request('PUT', '/auth/profile', {
      nickname: payload.nickname,
      avatarUrl: payload.avatarImage,
      bio: payload.bio
    })

    const mergedUser = {
      ...data,
      bio: payload.bio,
      avatarImage: payload.avatarImage || data.avatar_url
    }

    return store.syncRemoteUser(mergedUser)
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.saveUserProfile(payload)))
}

function normalizeFamilyMember(member = {}) {
  return {
    ...member,
    user: member.user || member.users || {}
  }
}

function getCurrentFamily() {
  const remoteTask = async () => {
    const data = await request('GET', '/family/current')
    const payload = {
      family: data.family,
      myRole: data.my_role,
      member: data.member,
      members: (data.members || []).map(normalizeFamilyMember)
    }
    store.syncRemoteFamily(payload)
    return payload
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.getCurrentFamily()))
}

function createFamilyInvite(payload = {}) {
  const remoteTask = async () => {
    const data = await request('POST', '/family/invite', {
      role: payload.role || 'editor',
      relation: payload.relation || ''
    })
    return data
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.createFamilyInvite(payload)))
}

function joinFamilyByInvite(code) {
  const remoteTask = async () => {
    await request('POST', '/family/join', { code })
    return getCurrentFamily()
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.joinFamilyByInvite(code)))
}

function updateFamilyName(name) {
  const remoteTask = async () => {
    await request('PATCH', '/family/name', { name })
    return getCurrentFamily()
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.updateFamilyName(name)))
}

function createRecipe(payload) {
  const remoteTask = async () => {
    const data = await request('POST', '/recipe/create', payload)
    const normalized = {
      ...normalizeRecipe(data.recipe),
      isMine: true
    }
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, [normalized]))
    return normalized
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.createRecipe(payload)))
}

function updateRecipe(recipeId, payload) {
  const remoteTask = async () => {
    const data = await request('PATCH', `/recipe/${recipeId}`, payload)
    const normalized = {
      ...normalizeRecipe(data.recipe),
      isMine: true
    }
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, [normalized]))
    return normalized
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.updateRecipe(recipeId, payload)))
}

function updateRecipeVisibility(recipeId, isPublic) {
  const remoteTask = async () => {
    const data = await request('PATCH', `/recipe/${recipeId}/visibility`, { isPublic })
    const normalized = {
      ...normalizeRecipe(data.recipe),
      isMine: true
    }
    store.syncRemoteRecipes(mergeRecipes(store.getState().recipes, [normalized]))
    return normalized
  }

  return runDataTask(remoteTask, () => Promise.resolve(store.updateRecipeVisibility(recipeId, isPublic)))
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

function serializeWeeklyPlan(plan) {
  return (plan || []).map(day => ({
    day_label: day.dayLabel,
    date: day.date || '',
    breakfast_id: day.breakfast?.id || null,
    lunch_id: day.lunch?.id || null,
    dinner_id: day.dinner?.id || null
  }))
}

function getCurrentWeekKey(date = new Date()) {
  const current = new Date(date)
  const weekDay = current.getDay() || 7
  current.setDate(current.getDate() - weekDay + 1)
  return current.toISOString().slice(0, 10)
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
  swapWeeklyPlanDay,
  buildShoppingList,
  getCurrentFamily,
  createFamilyInvite,
  joinFamilyByInvite,
  updateFamilyName,
  saveBaby,
  saveUserProfile,
  createRecipe,
  updateRecipe,
  updateRecipeVisibility,
  toggleElderMode,
  isMockEnabled,
  setMockEnabled,
  isDevLoginEnabled,
  setDevLoginEnabled
}
