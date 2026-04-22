/**
 * Supabase 认证服务 (Node.js 后端)
 * 创建或获取用户，生成 JWT token
 */

import '../lib/load-env.js'
import { supabase } from '../lib/supabase.js'

/**
 * 通过微信 openid 获取或创建用户
 * 返回 auth user 和 profile data
 */
export async function getOrCreateUser(openid, userData = {}) {
  try {
    // 1. 先查询 users 表中是否存在这个 openid
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id, auth_user_id, nickname, avatar_url')
      .eq('wechat_openid', openid)
      .single()

    if (existingUser) {
      if (userData?.nickName || userData?.avatarUrl) {
        await supabase
          .from('users')
          .update({
            nickname: userData.nickName || existingUser.nickname,
            avatar_url: userData.avatarUrl || existingUser.avatar_url
          })
          .eq('id', existingUser.id)
      }

      // 用户已存在，直接返回
      return {
        id: existingUser.id,
        auth_user_id: existingUser.auth_user_id,
        nickname: userData.nickName || existingUser.nickname,
        avatar_url: userData.avatarUrl || existingUser.avatar_url
      }
    }

    // 如果是"未找到"的错误，则继续创建新用户
    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError
    }

    // 2. 创建新的 Supabase Auth 用户（匿名用户或使用 email）
    const authEmail = `${openid}@wechat.local`
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      email_confirm: true,
      user_metadata: {
        wechat_openid: openid,
        nickname: userData.nickName || '未命名',
        avatar_url: userData.avatarUrl || null
      }
    })

    if (authError) {
      throw authError
    }

    // 3. 在 users 表中创建 profile 记录
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          auth_user_id: authUser.user.id,
          wechat_openid: openid,
          nickname: userData.nickName || '未命名',
          avatar_url: userData.avatarUrl || null
        }
      ])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return {
      id: newUser.id,
      auth_user_id: newUser.auth_user_id,
      nickname: newUser.nickname,
      avatar_url: newUser.avatar_url
    }
  } catch (error) {
    console.error('Get or create user error:', error.message)
    throw error
  }
}

/**
 * 为用户生成 session JWT token
 * 这个 token 用于小程序之后的 API 请求
 */
export async function generateSessionToken(userId, authUserId) {
  try {
    // 这里返回一个后续可用于鉴权的数据结构。
    const { data, error } = await supabase.auth.admin.getUserById(authUserId)

    if (error) {
      throw error
    }

    return {
      accessToken: data.user.user_metadata?.access_token || null,
      userId: userId,
      authUserId: authUserId
    }
  } catch (error) {
    console.error('Generate session token error:', error.message)
    throw error
  }
}

/**
 * 通过 JWT 验证获取用户信息
 */
export async function getUserFromToken(token) {
  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
      throw error
    }

    return data.user
  } catch (error) {
    console.error('Get user from token error:', error.message)
    throw error
  }
}

/**
 * 注销/删除 token（可选）
 */
export async function revokeToken(authUserId) {
  try {
    // 更新 users 表中的 last_sign_out_at
    const { error } = await supabase
      .from('users')
      .update({ last_sign_out_at: new Date().toISOString() })
      .eq('auth_user_id', authUserId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Revoke token error:', error.message)
    throw error
  }
}
