import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { buildShoppingListFromPlan, generateWeeklyPlan } from '../services/planner.js'

const router = express.Router()

router.use(authenticate)

router.post('/generate', async (req, res) => {
  try {
    const { baby_id: babyId, variant = 'default' } = req.body || {}
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const weeklyRecipes = await generateWeeklyPlan(req.user.id, babyId, variant)
    return res.json({
      code: 0,
      data: {
        weekly_recipes: weeklyRecipes
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to generate weekly plan'
    })
  }
})

router.post('/shopping-list', async (req, res) => {
  try {
    const { baby_id: babyId, variant = 'default' } = req.body || {}
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const weeklyRecipes = await generateWeeklyPlan(req.user.id, babyId, variant)
    const shoppingList = await buildShoppingListFromPlan(weeklyRecipes)

    return res.json({
      code: 0,
      data: {
        shopping_list: shoppingList
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
