/**
 * Supabase 客户端初始化
 * 小程序端使用 supabase-js v2
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eoavogkcjuextdsprzuh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_5Ca7Cz1eZ0-gktbZxlDUhw_zLW20FhO' // 替换为你的 anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * 小程序请求拦截器（为 supabase-js 添加微信授权 header）
 */
export async function getAuthHeaders() {
  const token = wx.getStorageSync('supabase_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * 获取当前会话
 */
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}
