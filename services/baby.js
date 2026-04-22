/**
 * 宝宝档案服务
 * CRUD 操作：创建、读取、更新、删除宝宝信息
 */

import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../utils/auth'

/**
 * 创建宝宝档案
 */
export async function createBaby(babyData) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { data, error } = await supabase
      .from('babies')
      .insert([
        {
          user_id: userId,
          nickname: babyData.nickname,
          gender: babyData.gender,
          birth_date: babyData.birthDate,
          allergies: babyData.allergies || [],
          dietary_preferences: babyData.dietaryPreferences || [],
          is_active: true
        }
      ])
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error('Create baby failed:', error)
    throw error
  }
}

/**
 * 获取当前用户的所有宝宝
 */
export async function getBabiesList() {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get babies list failed:', error)
    throw error
  }
}

/**
 * 获取单个宝宝信息
 */
export async function getBaby(babyId) {
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('id', babyId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get baby failed:', error)
    throw error
  }
}

/**
 * 更新宝宝档案
 */
export async function updateBaby(babyId, babyData) {
  try {
    const { data, error } = await supabase
      .from('babies')
      .update({
        nickname: babyData.nickname,
        gender: babyData.gender,
        birth_date: babyData.birthDate,
        allergies: babyData.allergies || [],
        dietary_preferences: babyData.dietaryPreferences || [],
        is_active: babyData.isActive ?? true
      })
      .eq('id', babyId)
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error('Update baby failed:', error)
    throw error
  }
}

/**
 * 删除宝宝档案
 */
export async function deleteBaby(babyId) {
  try {
    const { error } = await supabase
      .from('babies')
      .delete()
      .eq('id', babyId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Delete baby failed:', error)
    throw error
  }
}

/**
 * 计算宝宝当前月龄
 */
export function calculateAgeMonths(birthDate) {
  const birth = new Date(birthDate)
  const now = new Date()
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12
  months += now.getMonth() - birth.getMonth()
  
  return Math.max(0, months)
}
