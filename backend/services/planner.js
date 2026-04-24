import { supabase } from '../lib/supabase.js'

function hashText(text) {
  let hash = 0
  const source = String(text || '')
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 2147483647
  }
  return hash
}

function calculateAgeMonths(birthDate) {
  const birth = new Date(birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12
  months += now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) {
    months -= 1
  }
  return Math.max(months, 0)
}

export async function getBabyOrThrow(userId, babyId, familyId = null) {
  let query = supabase
    .from('babies')
    .select('*')
    .eq('id', babyId)

  query = familyId ? query.eq('family_id', familyId) : query.eq('user_id', userId)
  let { data, error } = await query.maybeSingle()

  if ((!data || error) && familyId) {
    const fallback = await supabase
      .from('babies')
      .select('*')
      .eq('id', babyId)
      .eq('user_id', userId)
      .maybeSingle()
    data = fallback.data
    error = fallback.error
  }

  if (error || !data) {
    throw new Error('Baby not found')
  }

  return data
}

export async function getSafeRecipesForBaby(baby, limit = 100) {
  const ageMonths = calculateAgeMonths(baby.birth_date)
  let query = supabase
    .from('recipes')
    .select('*')
    .lte('min_age_months', ageMonths)
    .gte('max_age_months', ageMonths)
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data, error } = await query
  if (error) throw error

  const allergies = baby.allergies || []
  return (data || []).filter(item => !allergies.some(allergy => (item.allergens || []).includes(allergy)))
}

function uniqueRecipes(recipes) {
  const bucket = new Map()
  ;(recipes || []).forEach(item => {
    if (item && item.id && !bucket.has(item.id)) {
      bucket.set(item.id, item)
    }
  })
  return Array.from(bucket.values())
}

async function getRequiredRecipesForBaby(userId, baby, recipeIds = []) {
  const ids = Array.from(new Set((recipeIds || []).filter(Boolean)))
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .in('id', ids)
    .or(`is_public.eq.true,created_by_user_id.eq.${userId}`)

  if (error) throw error

  const map = new Map((data || []).map(item => [item.id, item]))
  return ids.map(id => map.get(id)).filter(Boolean)
}

const WEEKLY_MEAL_KEYS = ['breakfast', 'lunch', 'dinner']

function getWeekRange(date = new Date()) {
  const today = new Date(date)
  const weekDay = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - weekDay + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    monday,
    sunday,
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10)
  }
}

function buildWeekDays() {
  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const { monday } = getWeekRange()

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return {
      dayLabel: weekdays[index],
      date: date.toISOString().slice(0, 10)
    }
  })
}

function orderRecipes(recipes, seedText) {
  const seed = hashText(seedText)
  return uniqueRecipes(recipes).sort((left, right) => {
    const leftScore = (hashText(left.id) + seed) % 1000003
    const rightScore = (hashText(right.id) + seed) % 1000003
    return leftScore - rightScore
  })
}

function pickSpacedRecipe(candidates, usageMap, lastDayMap, dayIndex, usedToday, slotIndex) {
  const ranked = (candidates || []).filter(Boolean).map((recipe, index) => ({
    recipe,
    index,
    usage: usageMap.get(recipe.id) || 0,
    lastDay: lastDayMap.get(recipe.id)
  }))
  if (!ranked.length) return null

  const spaced = ranked.filter(item => !usedToday.has(item.recipe.id) && (item.lastDay === undefined || dayIndex - item.lastDay >= 3))
  const noSameDay = ranked.filter(item => !usedToday.has(item.recipe.id))
  const pool = spaced.length ? spaced : (noSameDay.length ? noSameDay : ranked)
  return pool.sort((left, right) => {
    if (left.usage !== right.usage) return left.usage - right.usage
    const leftRotation = (left.index - slotIndex + ranked.length * 100) % ranked.length
    const rightRotation = (right.index - slotIndex + ranked.length * 100) % ranked.length
    return leftRotation - rightRotation
  })[0].recipe
}

function buildPlanFromRecipes(recipes, seedText, requiredRecipes = []) {
  const source = orderRecipes(requiredRecipes.concat(recipes || []), seedText)
  if (!source.length) {
    return []
  }

  const plan = buildWeekDays()
  const requiredQueue = uniqueRecipes(requiredRecipes).filter(recipe => source.some(item => item.id === recipe.id))
  const usageMap = new Map()
  const lastDayMap = new Map()

  for (let slotIndex = 0; slotIndex < 21; slotIndex += 1) {
    const dayIndex = Math.floor(slotIndex / 3)
    const mealKey = WEEKLY_MEAL_KEYS[slotIndex % 3]
    const usedToday = new Set(WEEKLY_MEAL_KEYS.map(key => plan[dayIndex][key]?.id).filter(Boolean))
    let recipe = null

    if (requiredQueue.length) {
      recipe = pickSpacedRecipe(requiredQueue, usageMap, lastDayMap, dayIndex, usedToday, slotIndex)
      const requiredIndex = requiredQueue.findIndex(item => item.id === recipe?.id)
      if (requiredIndex >= 0) requiredQueue.splice(requiredIndex, 1)
    }

    if (!recipe) {
      recipe = pickSpacedRecipe(source, usageMap, lastDayMap, dayIndex, usedToday, slotIndex)
    }

    if (!recipe) break
    plan[dayIndex][mealKey] = recipe
    usageMap.set(recipe.id, (usageMap.get(recipe.id) || 0) + 1)
    lastDayMap.set(recipe.id, dayIndex)
  }

  return plan
}

function serializeWeeklyPlan(plan) {
  return (plan || []).map(day => ({
    day_label: day.dayLabel,
    date: day.date,
    breakfast_id: day.breakfast?.id || null,
    lunch_id: day.lunch?.id || null,
    dinner_id: day.dinner?.id || null
  }))
}

async function hydrateWeeklyPlan(planJson = []) {
  const recipeIds = Array.from(new Set(
    (planJson || [])
      .flatMap(day => [day.breakfast_id, day.lunch_id, day.dinner_id])
      .filter(Boolean)
  ))
  const recipeMap = new Map()

  if (recipeIds.length) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
    if (error) throw error
    ;(data || []).forEach(item => {
      recipeMap.set(item.id, item)
    })
  }

  return (planJson || []).map((day, index) => ({
    dayLabel: day.day_label || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index] || `第${index + 1}天`,
    date: day.date,
    breakfast: day.breakfast_id ? (recipeMap.get(day.breakfast_id) || null) : null,
    lunch: day.lunch_id ? (recipeMap.get(day.lunch_id) || null) : null,
    dinner: day.dinner_id ? (recipeMap.get(day.dinner_id) || null) : null
  }))
}

export async function getCurrentWeeklyPlan(userId, babyId, familyId = null) {
  const { weekStart } = getWeekRange()
  let query = supabase
    .from('weekly_plan_snapshots')
    .select('*')
    .eq('baby_id', babyId)
    .eq('week_start', weekStart)

  query = familyId ? query.eq('family_id', familyId) : query.eq('user_id', userId)
  let { data, error } = await query.maybeSingle()

  if ((!data || error) && familyId) {
    const fallback = await supabase
      .from('weekly_plan_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('baby_id', babyId)
      .eq('week_start', weekStart)
      .maybeSingle()
    data = fallback.data
    error = fallback.error
  }

  if (error) throw error
  if (!data) return null

  return {
    snapshotId: data.id,
    isConfirmed: !!data.is_confirmed,
    weeklyRecipes: await hydrateWeeklyPlan(data.plan_json || [])
  }
}

export async function saveWeeklyPlan(userId, babyId, weeklyRecipes, { isConfirmed = false, familyId = null } = {}) {
  const { weekStart, weekEnd } = getWeekRange()
  const current = familyId ? await getCurrentWeeklyPlan(userId, babyId, familyId) : null
  const payload = {
    user_id: userId,
    baby_id: babyId,
    family_id: familyId || null,
    week_start: weekStart,
    week_end: weekEnd,
    is_confirmed: !!isConfirmed,
    plan_json: serializeWeeklyPlan(weeklyRecipes),
    updated_at: new Date().toISOString()
  }

  let data
  let error

  if (familyId) {
    let query = supabase.from('weekly_plan_snapshots')
    if (current?.snapshotId) {
      query = query
        .update(payload)
        .eq('id', current.snapshotId)
    } else {
      query = query.insert([payload])
    }

    const result = await query.select('*').single()
    data = result.data
    error = result.error
  } else {
    const result = await supabase
      .from('weekly_plan_snapshots')
      .upsert(payload, {
        onConflict: 'user_id,baby_id,week_start'
      })
      .select('*')
      .single()
    data = result.data
    error = result.error
  }

  if (error) throw error

  return {
    isConfirmed: !!data.is_confirmed,
    weeklyRecipes: await hydrateWeeklyPlan(data.plan_json || [])
  }
}

export async function confirmCurrentWeeklyPlan(userId, babyId, fallbackPlan = [], familyId = null) {
  const current = await getCurrentWeeklyPlan(userId, babyId, familyId)
  if (current?.weeklyRecipes?.length) {
    return saveWeeklyPlan(userId, babyId, current.weeklyRecipes, { isConfirmed: true, familyId })
  }
  return saveWeeklyPlan(userId, babyId, fallbackPlan, { isConfirmed: true, familyId })
}

export async function generateTodayRecommendation(userId, babyId, variant = 'default', familyId = null) {
  const baby = await getBabyOrThrow(userId, babyId, familyId)
  const recipes = await getSafeRecipesForBaby(baby)
  const plan = buildPlanFromRecipes(recipes, `${babyId}:${variant}`)
  const today = plan[0]

  return {
    breakfast: today?.breakfast || null,
    lunch: today?.lunch || null,
    dinner: today?.dinner || null,
    suggestions: recipes.slice(3, 6)
  }
}

export async function swapMealRecommendation(userId, babyId, mealType, variant = 'swap', excludeRecipeIds = [], familyId = null) {
  const baby = await getBabyOrThrow(userId, babyId, familyId)
  const recipes = await getSafeRecipesForBaby(baby)
  const excluded = new Set((excludeRecipeIds || []).filter(Boolean))
  const mapped = generateMealCandidates(recipes, `${babyId}:${mealType}:${variant}`)
  const filtered = mapped.filter(item => !excluded.has(item.id))
  return filtered[0] || mapped[0] || null
}

function generateMealCandidates(recipes, seedText) {
  const source = recipes.slice()
  const seed = hashText(seedText)
  return source.sort((left, right) => {
    const leftScore = (hashText(left.id) + seed) % 997
    const rightScore = (hashText(right.id) + seed) % 997
    return leftScore - rightScore
  })
}

export async function generateWeeklyPlan(userId, babyId, variant = 'default', requiredRecipeIds = [], familyId = null) {
  const baby = await getBabyOrThrow(userId, babyId, familyId)
  const [recipes, requiredRecipes] = await Promise.all([
    getSafeRecipesForBaby(baby),
    getRequiredRecipesForBaby(userId, baby, requiredRecipeIds)
  ])
  return buildPlanFromRecipes(recipes, `${babyId}:weekly:${variant}`, requiredRecipes)
}

export async function buildShoppingListFromPlan(plan) {
  const summary = {}

  plan.forEach(day => {
    ;['breakfast', 'lunch', 'dinner'].forEach(mealKey => {
      const recipe = day[mealKey]
      if (!recipe || !Array.isArray(recipe.ingredients)) return
      recipe.ingredients.forEach(item => {
        const name = item.name || '食材'
        const quantity = item.quantity ? `${item.quantity}${item.unit || ''}` : (item.amount || item.unit || '适量')
        summary[name] = summary[name] || []
        summary[name].push(quantity)
      })
    })
  })

  return Object.keys(summary).map(name => ({
    ingredient: name,
    summary: summary[name].slice(0, 3).join(' + ')
  }))
}
