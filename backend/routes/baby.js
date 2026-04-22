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
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

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
          nickname: payload.nickname,
          gender: toDbGender(payload.gender),
          birth_date: payload.birthDate,
          allergies: payload.allergies || [],
          dietary_preferences: payload.dietaryPreferences || [],
          is_active: payload.isActive ?? true
        }
      ])
      .select()
      .single()

    if (error) throw error

    if (created.is_active) {
      await supabase
        .from('babies')
        .update({ is_active: false })
        .eq('user_id', req.user.id)
        .neq('id', created.id)
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

    const { data: updated, error } = await supabase
      .from('babies')
      .update({
        nickname: payload.nickname,
        gender: toDbGender(payload.gender),
        birth_date: payload.birthDate,
        allergies: payload.allergies || [],
        dietary_preferences: payload.dietaryPreferences || [],
        is_active: payload.isActive ?? true
      })
      .eq('id', babyId)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    if (updated.is_active) {
      await supabase
        .from('babies')
        .update({ is_active: false })
        .eq('user_id', req.user.id)
        .neq('id', updated.id)
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
