import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

function toDbGender(gender) {
  if (gender === '男' || gender === 'male') return 'male'
  if (gender === '女' || gender === 'female') return 'female'
  return null
}

router.use(authenticate)

router.get('/list', async (req, res) => {
  try {
    let query = supabase
      .from('babies')
      .select('*')
      .order('created_at', { ascending: false })
    const familyId = req.family?.id

    query = familyId ? query.eq('family_id', familyId) : query.eq('user_id', req.user.id)
    let { data, error } = await query

    if (!error && familyId && (!data || !data.length)) {
      const fallback = await supabase
        .from('babies')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
      data = fallback.data || []
      error = fallback.error
    }

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        babies: data || []
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch babies'
    })
  }
})

router.post('/create', async (req, res) => {
  try {
    const payload = req.body || {}

    const { data: created, error } = await supabase
      .from('babies')
      .insert([
        {
          user_id: req.user.id,
          family_id: req.family?.id || null,
          nickname: payload.nickname,
          gender: toDbGender(payload.gender),
          birth_date: payload.birthDate,
          allergies: payload.allergies || [],
          dietary_preferences: payload.dietaryPreferences || [],
          avatar_url: payload.avatarUrl || null,
          is_active: payload.isActive ?? true
        }
      ])
      .select()
      .single()

    if (error) throw error

    if (created.is_active) {
      let updateQuery = supabase
        .from('babies')
        .update({ is_active: false })
        .neq('id', created.id)
      updateQuery = req.family?.id ? updateQuery.eq('family_id', req.family.id) : updateQuery.eq('user_id', req.user.id)
      await updateQuery
    }

    return res.json({
      code: 0,
      data: {
        baby: created
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to create baby'
    })
  }
})

router.put('/:babyId', async (req, res) => {
  try {
    const payload = req.body || {}
    const { babyId } = req.params

    let ownershipQuery = supabase
      .from('babies')
      .select('*')
      .eq('id', babyId)
    ownershipQuery = req.family?.id ? ownershipQuery.eq('family_id', req.family.id) : ownershipQuery.eq('user_id', req.user.id)
    let { data: current, error: currentError } = await ownershipQuery.maybeSingle()

    if ((!current || currentError) && req.family?.id) {
      const fallback = await supabase
        .from('babies')
        .select('*')
        .eq('id', babyId)
        .eq('user_id', req.user.id)
        .maybeSingle()
      current = fallback.data
      currentError = fallback.error
    }

    if (currentError || !current) {
      return res.status(404).json({
        code: 404,
        message: 'Baby not found'
      })
    }

    const { data: updated, error } = await supabase
      .from('babies')
      .update({
        nickname: payload.nickname,
        gender: toDbGender(payload.gender),
        birth_date: payload.birthDate,
        allergies: payload.allergies || [],
        dietary_preferences: payload.dietaryPreferences || [],
        avatar_url: payload.avatarUrl || null,
        is_active: payload.isActive ?? true,
        family_id: current.family_id || req.family?.id || null
      })
      .eq('id', babyId)
      .select()
      .single()

    if (error) throw error

    if (updated.is_active) {
      let updateQuery = supabase
        .from('babies')
        .update({ is_active: false })
        .neq('id', updated.id)
      updateQuery = updated.family_id ? updateQuery.eq('family_id', updated.family_id) : updateQuery.eq('user_id', req.user.id)
      await updateQuery
    }

    return res.json({
      code: 0,
      data: {
        baby: updated
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to update baby'
    })
  }
})

export default router
