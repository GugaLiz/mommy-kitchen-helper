/**
 * Express 认证路由（微信登录）
 * 接收 code → 交换 openid → 创建/查询用户 → 返回 token
 */

import '../lib/load-env.js'
import express from 'express'
import jwt from 'jsonwebtoken'
import * as wechatService from '../services/wechat.js'
import * as supabaseAuthService from '../services/supabaseAuth.js'
import { supabase } from '../lib/supabase.js'
import { getJwtSecret } from '../lib/config.js'
import { ensureDefaultFamilyForUser } from '../services/family.js'

const router = express.Router()

/**
 * POST /api/auth/wechat-login
 * 
 * Request body:
 * {
 *   code: string,                    // 微信 login() 返回的 code
 *   userInfo?: {                     // 可选：用户允许授权返回的信息
 *     nickName: string,
 *     avatarUrl: string,
 *     phoneNumber?: string
 *   }
 * }
 *
 * Response:
 * {
 *   code: 0,
 *   data: {
 *     token: string,                 // 用于后续 API 请求的 JWT token
 *     user_id: string,               // 业务用户 ID
 *     auth_user_id: string,          // Supabase auth user ID
 *     openid: string,
 *     nickname: string
 *   }
 * }
 */
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: 'Missing code parameter'
      })
    }

    // 1. 用 code 换取 openid 和 session key
    const wechatSession = await wechatService.code2Session(code)
    const { openid } = wechatSession

    console.log(`[WeChat Login] openid: ${openid}`)

    // 2. 获取或创建用户
    const user = await supabaseAuthService.getOrCreateUser(openid, userInfo)
    const familyBundle = await ensureDefaultFamilyForUser(user)

    console.log(`[User] id: ${user.id}, auth_user_id: ${user.auth_user_id}`)

    // 3. 生成 session token
    // 注意：实际上应该从 Supabase Auth 生成或获取有效的 JWT
    // 这里做法是使用 Supabase 的 service role 密钥生成一个长期 token
    
    // 更好的做法是：让小程序直接用 openid + session_key 到其他端点获取 Supabase 的真实 JWT
    // 或者在后端颁发一个自定义的 JWT token，包含 user_id 和 auth_user_id

    const token = generateCustomToken(user.id, user.auth_user_id)

    // 4. 更新用户最后登录时间
    // 5. 返回给小程序
    return res.json({
      code: 0,
      message: 'Login successful',
      data: {
        token: token,
        user_id: user.id,
        auth_user_id: user.auth_user_id,
        openid: openid,
        nickname: user.nickname || userInfo?.nickName || '用户',
        family_id: familyBundle.family.id,
        family_role: familyBundle.member.role
      }
    })
  } catch (error) {
    console.error('[WeChat Login Error]', error)

    const status = error.status || 500

    return res.status(status).json({
      code: status,
      message: error.message || 'Internal server error'
    })
  }
})

/**
 * 生成自定义 JWT token（简单示例）
 * 在生产环境中应该使用 jsonwebtoken 库并妥善保管密钥
 */
function generateCustomToken(userId, authUserId) {
  const payload = {
    user_id: userId,
    auth_user_id: authUserId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 天过期
  }

  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256'
  })
}

router.post('/dev-login', async (req, res) => {
  try {
    if (process.env.DEV_LOGIN_ENABLED === 'false') {
      return res.status(403).json({
        code: 403,
        message: 'Dev login disabled'
      })
    }

    const openid = req.body?.openid || `dev-openid-${Date.now()}`
    const nickname = req.body?.nickname || '开发测试用户'
    const user = await supabaseAuthService.getOrCreateUser(openid, {
      nickName: nickname
    })
    const familyBundle = await ensureDefaultFamilyForUser(user)
    const token = generateCustomToken(user.id, user.auth_user_id)

    return res.json({
      code: 0,
      message: 'Dev login successful',
      data: {
        token,
        user_id: user.id,
        auth_user_id: user.auth_user_id,
        openid,
        nickname: user.nickname || nickname,
        family_id: familyBundle.family.id,
        family_role: familyBundle.member.role
      }
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message || 'Dev login failed'
    })
  }
})

/**
 * GET /api/auth/profile
 * 获取当前登录用户的信息（需要提供 token）
 */
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Missing authorization token'
      })
    }

    // 验证 token
    const decoded = jwt.verify(token, getJwtSecret())

    // 从数据库获取用户信息
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.user_id)
      .single()

    if (error) {
      return res.status(404).json({
        code: 404,
        message: 'User not found'
      })
    }

    const familyBundle = await ensureDefaultFamilyForUser(data)

    return res.json({
      code: 0,
      data: {
        ...data,
        family_id: familyBundle.family.id,
        family_role: familyBundle.member.role,
        family_name: familyBundle.family.name
      }
    })
  } catch (error) {
    console.error('[Get Profile Error]', error)

    return res.status(401).json({
      code: 401,
      message: 'Invalid or expired token'
    })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Missing authorization token'
      })
    }

    const decoded = jwt.verify(token, getJwtSecret())
    const payload = req.body || {}
    const updateData = {}

    if (payload.nickname !== undefined) {
      updateData.nickname = String(payload.nickname || '').trim().slice(0, 20)
    }

    if (payload.avatarUrl !== undefined) {
      updateData.avatar_url = payload.avatarUrl || null
    }

    if (payload.bio !== undefined) {
      updateData.bio = payload.bio || null
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({
        code: 400,
        message: 'No profile fields to update'
      })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', decoded.user_id)
      .select('*')
      .single()

    if (error || !data) {
      return res.status(500).json({
        code: 500,
        message: error?.message || 'Failed to update profile'
      })
    }

    return res.json({
      code: 0,
      message: 'Profile updated',
      data
    })
  } catch (error) {
    console.error('[Update Profile Error]', error)

    return res.status(401).json({
      code: 401,
      message: 'Invalid or expired token'
    })
  }
})

/**
 * POST /api/auth/logout
 * 登出
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Missing authorization token'
      })
    }

    jwt.verify(token, getJwtSecret())

    return res.json({
      code: 0,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('[Logout Error]', error)

    return res.status(500).json({
      code: 500,
      message: 'Logout failed'
    })
  }
})

export default router
