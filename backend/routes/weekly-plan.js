import express from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  buildShoppingListFromPlan,
  confirmCurrentWeeklyPlan,
  generateWeeklyPlan,
  getCurrentWeeklyPlan,
  saveWeeklyPlan
} from '../services/planner.js'

const router = express.Router()

router.use(authenticate)

router.get('/current', async (req, res) => {
  try {
    const babyId = req.query.baby_id
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const current = await getCurrentWeeklyPlan(req.user.id, babyId, req.family?.id || null)
    return res.json({
      code: 0,
      data: {
        weekly_recipes: current?.weeklyRecipes || [],
        is_confirmed: !!current?.isConfirmed
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to load weekly plan'
    })
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { baby_id: babyId, variant = 'default', required_recipe_ids: requiredRecipeIds = [] } = req.body || {}
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const weeklyRecipes = await generateWeeklyPlan(req.user.id, babyId, variant, requiredRecipeIds, req.family?.id || null)
    const saved = await saveWeeklyPlan(req.user.id, babyId, weeklyRecipes, {
      isConfirmed: false,
      familyId: req.family?.id || null
    })
    return res.json({
      code: 0,
      data: {
        weekly_recipes: saved.weeklyRecipes,
        is_confirmed: saved.isConfirmed
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to generate weekly plan'
    })
  }
})

router.post('/save', async (req, res) => {
  try {
    const {
      baby_id: babyId,
      weekly_recipes: weeklyRecipes = [],
      is_confirmed: isConfirmed = false
    } = req.body || {}

    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    if (!Array.isArray(weeklyRecipes) || !weeklyRecipes.length) {
      return res.status(400).json({
        code: 400,
        message: 'Missing weekly_recipes'
      })
    }

    const saved = await saveWeeklyPlan(req.user.id, babyId, weeklyRecipes, {
      isConfirmed,
      familyId: req.family?.id || null
    })
    return res.json({
      code: 0,
      data: {
        weekly_recipes: saved.weeklyRecipes,
        is_confirmed: saved.isConfirmed
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to save weekly plan'
    })
  }
})

router.post('/shopping-list', async (req, res) => {
  try {
    const { baby_id: babyId, variant = 'default', required_recipe_ids: requiredRecipeIds = [] } = req.body || {}
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    let current = await getCurrentWeeklyPlan(req.user.id, babyId, req.family?.id || null)
    if (!current?.weeklyRecipes?.length) {
      const weeklyRecipes = await generateWeeklyPlan(req.user.id, babyId, variant, requiredRecipeIds, req.family?.id || null)
      current = await confirmCurrentWeeklyPlan(req.user.id, babyId, weeklyRecipes, req.family?.id || null)
    } else {
      current = await confirmCurrentWeeklyPlan(req.user.id, babyId, current.weeklyRecipes, req.family?.id || null)
    }

    const shoppingList = await buildShoppingListFromPlan(current.weeklyRecipes)

    return res.json({
      code: 0,
      data: {
        shopping_list: shoppingList,
        weekly_recipes: current.weeklyRecipes,
        is_confirmed: current.isConfirmed
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to build shopping list'
    })
  }
})

export default router
