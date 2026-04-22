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

export async function getBabyOrThrow(userId, babyId) {
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', babyId)
    .eq('user_id', userId)
    .single()

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

function buildPlanFromRecipes(recipes, seedText) {
  const source = recipes.length ? recipes : []
  const seed = hashText(seedText)
  if (!source.length) {
    return []
  }

  const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const today = new Date()
  const weekDay = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - weekDay + 1)

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const base = (seed + index * 3) % source.length
    return {
      dayLabel: weekdays[index],
      date: date.toISOString().slice(0, 10),
      breakfast: source[base % source.length],
      lunch: source[(base + 1) % source.length],
      dinner: source[(base + 2) % source.length]
    }
  })
}

export async function generateTodayRecommendation(userId, babyId, variant = 'default') {
  const baby = await getBabyOrThrow(userId, babyId)
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

export async function swapMealRecommendation(userId, babyId, mealType, variant = 'swap', excludeRecipeIds = []) {
  const baby = await getBabyOrThrow(userId, babyId)
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

export async function generateWeeklyPlan(userId, babyId, variant = 'default') {
  const baby = await getBabyOrThrow(userId, babyId)
  const recipes = await getSafeRecipesForBaby(baby)
  return buildPlanFromRecipes(recipes, `${babyId}:weekly:${variant}`)
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
