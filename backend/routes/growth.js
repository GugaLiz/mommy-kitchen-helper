import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticate)

router.get('/history', async (req, res) => {
  try {
    const { baby_id: babyId, limit = 12 } = req.query

    if (!babyId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing baby_id'
      })
    }

    let babyQuery = supabase
      .from('babies')
      .select('id')
      .eq('id', babyId)
    babyQuery = req.family?.id ? babyQuery.eq('family_id', req.family.id) : babyQuery.eq('user_id', req.user.id)
    let { data: baby, error: babyError } = await babyQuery.maybeSingle()

    if ((!baby || babyError) && req.family?.id) {
      const fallback = await supabase
        .from('babies')
        .select('id, family_id')
        .eq('id', babyId)
        .eq('user_id', req.user.id)
        .maybeSingle()
      baby = fallback.data
      babyError = fallback.error
    }

    if (babyError || !baby) {
      return res.status(404).json({
        code: 404,
        message: 'Baby not found'
      })
    }

    let recordQuery = supabase
      .from('growth_records')
      .select('*')
      .eq('baby_id', babyId)
      .order('measured_date', { ascending: false })
      .limit(Number(limit))
    recordQuery = req.family?.id ? recordQuery.eq('family_id', req.family.id) : recordQuery.eq('user_id', req.user.id)
    let { data: records, error } = await recordQuery

    if (!error && req.family?.id && (!records || !records.length)) {
      const fallback = await supabase
        .from('growth_records')
        .select('*')
        .eq('baby_id', babyId)
        .eq('user_id', req.user.id)
        .order('measured_date', { ascending: false })
        .limit(Number(limit))
      records = fallback.data || []
      error = fallback.error
    }

    if (error) throw error

    const normalized = (records || []).reverse()

    return res.json({
      code: 0,
      data: {
        records: normalized,
        latest_record: normalized[normalized.length - 1] || null
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to fetch growth records'
    })
  }
})

router.post('/add', async (req, res) => {
  try {
    const payload = req.body || {}

    if (!payload.baby_id || !payload.height || !payload.weight) {
      return res.status(400).json({
        code: 400,
        message: 'Missing required growth fields'
      })
    }

    let babyQuery = supabase
      .from('babies')
      .select('id')
      .eq('id', payload.baby_id)
    babyQuery = req.family?.id ? babyQuery.eq('family_id', req.family.id) : babyQuery.eq('user_id', req.user.id)
    let { data: baby, error: babyError } = await babyQuery.maybeSingle()

    if ((!baby || babyError) && req.family?.id) {
      const fallback = await supabase
        .from('babies')
        .select('id, family_id')
        .eq('id', payload.baby_id)
        .eq('user_id', req.user.id)
        .maybeSingle()
      baby = fallback.data
      babyError = fallback.error
    }

    if (babyError || !baby) {
      return res.status(404).json({
        code: 404,
        message: 'Baby not found'
      })
    }

    const { data: inserted, error } = await supabase
      .from('growth_records')
      .insert([
        {
          baby_id: payload.baby_id,
          user_id: req.user.id,
          family_id: req.family?.id || baby.family_id || null,
          measured_date: payload.measured_date,
          height: payload.height,
          weight: payload.weight
        }
      ])
      .select()
      .single()

    if (error) throw error

    return res.json({
      code: 0,
      data: {
        record: inserted
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Failed to add growth record'
    })
  }
})

export default router
