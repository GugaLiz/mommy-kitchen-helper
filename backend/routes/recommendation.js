import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { generateTodayRecommendation, swapMealRecommendation } from '../services/planner.js'

const router = express.Router()

router.use(authenticate)

router.get('/today', async (req, res) => {
  try {
    const { baby_id: babyId } = req.query
    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const result = await generateTodayRecommendation(req.user.id, babyId)
    return res.json({
      code: 0,
      data: result
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to get recommendations'
    })
  }
})

router.post('/swap-meal', async (req, res) => {
  try {
    const {
      baby_id: babyId,
      meal_type: mealType,
      exclude_recipe_ids: excludeRecipeIds
    } = req.body || {}
    if (!babyId || !mealType) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id or meal_type'
      })
    }

    const recipe = await swapMealRecommendation(
      req.user.id,
      babyId,
      mealType,
      String(Date.now()),
      Array.isArray(excludeRecipeIds) ? excludeRecipeIds : []
    )
    return res.json({
      code: 0,
      data: {
        new_recipe: recipe
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to swap meal'
    })
  }
})

export default router
