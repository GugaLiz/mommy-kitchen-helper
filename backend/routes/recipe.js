import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

router.get('/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      ageMin,
      ageMax,
      tags,
      keyword
    } = req.query

    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (keyword) {
      query = query.ilike('name', `%${keyword}%`)
    }

    if (ageMin) {
      query = query.lte('min_age_months', Number(ageMin))
    }

    if (ageMax) {
      query = query.gte('max_age_months', Number(ageMax))
    }

    if (tags) {
      const tagList = String(tags).split(',').filter(Boolean)
      if (tagList.length) {
        query = query.contains('tags', tagList)
      }
    }

    const pageNum = Number(page)
    const pageSize = Number(limit)
    const from = (pageNum - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query.range(from, to)
    if (error) throw error

    return res.json({
      code: 0,
      data: {
        recipes: data || [],
        total: count || 0,
        page: pageNum,
        pageSize
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch recipes'
    })
  }
})

router.get('/collections/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recipe_collections')
      .select('recipe_id')
      .eq('user_id', req.user.id)

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        recipe_ids: (data || []).map(item => item.recipe_id)
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch collections'
    })
  }
})

router.get('/collections/recipes', async (req, res) => {
  try {
    const { data: collectionRows, error: collectionError } = await supabase
      .from('recipe_collections')
      .select('recipe_id, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (collectionError) throw collectionError

    const recipeIds = (collectionRows || []).map(item => item.recipe_id)
    if (!recipeIds.length) {
      return res.json({
        code: 0,
        data: {
          recipes: []
        }
      })
    }

    const { data: recipes, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)

    if (recipeError) throw recipeError

    const recipeMap = new Map((recipes || []).map(item => [item.id, item]))
    const orderedRecipes = recipeIds.map(id => recipeMap.get(id)).filter(Boolean)

    return res.json({
      code: 0,
      data: {
        recipes: orderedRecipes
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch collected recipes'
    })
  }
})

router.get('/made/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('made_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        total: count || 0
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch made count'
    })
  }
})

router.get('/made/list', async (req, res) => {
  try {
    const { data: madeRows, error: madeError } = await supabase
      .from('made_recipes')
      .select('recipe_id, made_date, created_at')
      .eq('user_id', req.user.id)
      .order('made_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (madeError) throw madeError

    const latestMap = new Map()
    ;(madeRows || []).forEach(item => {
      if (!latestMap.has(item.recipe_id)) {
        latestMap.set(item.recipe_id, item)
      }
    })

    const recipeIds = Array.from(latestMap.keys())
    if (!recipeIds.length) {
      return res.json({
        code: 0,
        data: {
          recipes: []
        }
      })
    }

    const { data: recipes, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)

    if (recipeError) throw recipeError

    const recipeMap = new Map((recipes || []).map(item => [item.id, item]))
    const orderedRecipes = recipeIds.map(id => recipeMap.get(id)).filter(Boolean)

    return res.json({
      code: 0,
      data: {
        recipes: orderedRecipes
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch made recipes'
    })
  }
})

router.get('/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params

    const [{ data, error }, { data: collection }, { count: madeCount, error: madeError }] = await Promise.all([
      supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single(),
      supabase
        .from('recipe_collections')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('user_id', req.user.id)
        .maybeSingle(),
      supabase
        .from('made_recipes')
        .select('*', { count: 'exact', head: true })
        .eq('recipe_id', recipeId)
        .eq('user_id', req.user.id)
    ])

    if (error) throw error
    if (madeError) throw madeError

    return res.json({
      code: 0,
      data: {
        recipe: data,
        is_collected: !!collection,
        times_user_made: madeCount || 0
      }
    })
  } catch (error) {
    return res.status(404).json({
      code: 404,
      message: error.message || 'Recipe not found'
    })
  }
})

router.post('/:recipeId/collect', async (req, res) => {
  try {
    const { recipeId } = req.params
    const action = req.body?.action || 'add'

    if (action === 'remove') {
      const { error } = await supabase
        .from('recipe_collections')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', req.user.id)

      if (error) throw error
      return res.json({
        code: 0,
        data: {
          is_collected: false
        }
      })
    }

    const { error } = await supabase
      .from('recipe_collections')
      .upsert(
        [{
          recipe_id: recipeId,
          user_id: req.user.id
        }],
        { onConflict: 'user_id,recipe_id', ignoreDuplicates: true }
      )

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        is_collected: true
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to update collection'
    })
  }
})

router.post('/:recipeId/mark-made', async (req, res) => {
  try {
    const { recipeId } = req.params
    const payload = req.body || {}
    if (!payload.baby_id) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    const { data, error } = await supabase
      .from('made_recipes')
      .insert([
        {
          recipe_id: recipeId,
          baby_id: payload.baby_id,
          user_id: req.user.id,
          made_date: payload.made_date || new Date().toISOString().slice(0, 10),
          rating: payload.rating || null,
          notes: payload.notes || null
        }
      ])
      .select()
      .single()

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        entry_id: data.id
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to mark recipe made'
    })
  }
})

export default router
