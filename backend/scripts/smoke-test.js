import axios from 'axios'
import { startServer } from '../app.js'

const smokePort = process.env.SMOKE_PORT || '3010'
const baseURL = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${smokePort}/api`

function logStep(title, payload) {
  console.log(`\n[smoke] ${title}`)
  if (payload !== undefined) {
    console.log(JSON.stringify(payload, null, 2))
  }
}

async function request(method, path, data, token) {
  const response = await axios({
    baseURL,
    url: path,
    method,
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    validateStatus: () => true
  })

  if (response.status < 200 || response.status >= 300 || response.data?.code !== 0) {
    throw new Error(`${method} ${path} failed: ${response.status} ${response.data?.message || 'unknown error'}`)
  }

  return response.data.data
}

async function main() {
  const server = startServer(smokePort)
  logStep('Starting smoke test', { baseURL })

  try {
    const login = await request('POST', '/auth/dev-login', {
      openid: `smoke-openid-${Date.now()}`,
      nickname: 'Smoke Tester'
    })
    const token = login.token
    logStep('Dev login ok', { user_id: login.user_id, auth_user_id: login.auth_user_id })

    const profile = await request('GET', '/auth/profile', null, token)
    logStep('Profile ok', { id: profile.id, nickname: profile.nickname })

    const createdBaby = await request('POST', '/baby/create', {
      nickname: '联调宝宝',
      gender: '男',
      birthDate: '2024-01-15',
      allergies: ['鸡蛋'],
      dietaryPreferences: ['爱吃水果'],
      isActive: true
    }, token)
    const babyId = createdBaby.baby.id
    logStep('Baby create ok', createdBaby.baby)

    const babies = await request('GET', '/baby/list', null, token)
    logStep('Baby list ok', { count: babies.babies.length })

    const recipes = await request('GET', '/recipe/list?page=1&limit=5', null, token)
    if (!recipes.recipes?.length) {
      throw new Error('No recipes found. Run supabase/seed.sql first.')
    }
    const recipeId = recipes.recipes[0].id
    logStep('Recipe list ok', { total: recipes.total, first_recipe: recipes.recipes[0].name })

    const recipeDetail = await request('GET', `/recipe/${recipeId}`, null, token)
    logStep('Recipe detail ok', { recipe: recipeDetail.recipe.name })

    const collected = await request('POST', `/recipe/${recipeId}/collect`, { action: 'add' }, token)
    logStep('Collect ok', collected)

    const collectionList = await request('GET', '/recipe/collections/list', null, token)
    logStep('Collection list ok', { recipe_ids: collectionList.recipe_ids })

    const marked = await request('POST', `/recipe/${recipeId}/mark-made`, {
      baby_id: babyId
    }, token)
    logStep('Mark made ok', marked)

    const madeCount = await request('GET', '/recipe/made/count', null, token)
    logStep('Made count ok', madeCount)

    const growth = await request('POST', '/growth-record/add', {
      baby_id: babyId,
      measured_date: '2026-04-21',
      height: 82.5,
      weight: 10.8
    }, token)
    logStep('Growth add ok', growth.record)

    const growthHistory = await request('GET', `/growth-record/history?baby_id=${encodeURIComponent(babyId)}&limit=12`, null, token)
    logStep('Growth history ok', { count: growthHistory.records.length })

    const today = await request('GET', `/recommendation/today?baby_id=${encodeURIComponent(babyId)}`, null, token)
    logStep('Today recommendation ok', {
      breakfast: today.breakfast?.name,
      lunch: today.lunch?.name,
      dinner: today.dinner?.name
    })

    const swapped = await request('POST', '/recommendation/swap-meal', {
      baby_id: babyId,
      meal_type: 'breakfast'
    }, token)
    logStep('Swap meal ok', { new_recipe: swapped.new_recipe?.name })

    const weekly = await request('POST', '/weekly-plan/generate', {
      baby_id: babyId,
      variant: 'smoke'
    }, token)
    logStep('Weekly plan ok', { days: weekly.weekly_recipes.length })

    const shopping = await request('POST', '/weekly-plan/shopping-list', {
      baby_id: babyId,
      variant: 'smoke'
    }, token)
    logStep('Shopping list ok', { items: shopping.shopping_list.length })

    console.log('\n[smoke] All core API checks passed.')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  console.error('\n[smoke] FAILED')
  console.error(error.message)
  process.exit(1)
})
