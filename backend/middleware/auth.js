import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'
import { getJwtSecret } from '../lib/config.js'
import { ensureDefaultFamilyForUser } from '../services/family.js'

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Missing authorization token'
      })
    }

    const decoded = jwt.verify(token, getJwtSecret())

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.user_id)
      .single()

    if (error || !user) {
      return res.status(401).json({
        code: 401,
        message: 'Invalid user session'
      })
    }

    req.auth = decoded
    req.user = user
    const familyBundle = await ensureDefaultFamilyForUser(user)
    req.family = familyBundle.family
    req.familyMember = familyBundle.member
    next()
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid or expired token'
    })
  }
}
