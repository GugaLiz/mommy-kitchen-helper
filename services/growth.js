/**
 * 生长记录服务
 * 记录、查询、分析宝宝的身高体重数据
 */

import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../utils/auth'

/**
 * 添加生长记录
 */
export async function addGrowthRecord(babyId, recordData) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { data, error } = await supabase
      .from('growth_records')
      .insert([
        {
          baby_id: babyId,
          user_id: userId,
          measured_date: recordData.measuredDate || new Date().toISOString().split('T')[0],
          height: recordData.height,
          weight: recordData.weight
        }
      ])
      .select()

    if (error) throw error

    return data[0]
  } catch (error) {
    console.error('Add growth record failed:', error)
    throw error
  }
}

/**
 * 获取宝宝的生长记录历史
 * @param {string} babyId - 宝宝 ID
 * @param {number} limit - 最近多少条记录（默认 12 个月）
 */
export async function getGrowthRecords(babyId, limit = 12) {
  try {
    const { data, error } = await supabase
      .from('growth_records')
      .select('*')
      .eq('baby_id', babyId)
      .order('measured_date', { ascending: false })
      .limit(limit)

    if (error) throw error

    // 反序（从早到晚用于绘图）
    return (data || []).reverse()
  } catch (error) {
    console.error('Get growth records failed:', error)
    throw error
  }
}

/**
 * 获取最新的生长记录
 */
export async function getLatestGrowthRecord(babyId) {
  try {
    const { data, error } = await supabase
      .from('growth_records')
      .select('*')
      .eq('baby_id', babyId)
      .order('measured_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  } catch (error) {
    console.error('Get latest growth record failed:', error)
    throw error
  }
}

/**
 * 获取两条记录之间的变化量
 */
export async function getGrowthChange(babyId) {
  try {
    const records = await getGrowthRecords(babyId, 2)
    
    if (records.length < 2) {
      return null
    }

    const latest = records[records.length - 1]
    const previous = records[records.length - 2]

    return {
      heightChange: (latest.height - previous.height).toFixed(2),
      weightChange: (latest.weight - previous.weight).toFixed(2),
      daysDiff: Math.floor((new Date(latest.measured_date) - new Date(previous.measured_date)) / (1000 * 60 * 60 * 24))
    }
  } catch (error) {
    console.error('Get growth change failed:', error)
    return null
  }
}

/**
 * 删除生长记录
 */
export async function deleteGrowthRecord(recordId) {
  try {
    const { error } = await supabase
      .from('growth_records')
      .delete()
      .eq('id', recordId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Delete growth record failed:', error)
    throw error
  }
}

/**
 * 简单的百分位计算示例（实际应该用标准生长曲线表）
 * 这里仅做演示
 */
export function estimatePercentile(value, standardMean, standardStd) {
  // z-score 计算
  const zScore = (value - standardMean) / standardStd
  
  // 用简单的近似公式计算百分位（实际应用应使用 erf 函数）
  // 这里仅作示意
  if (zScore > 2) return 97
  if (zScore > 1) return 84
  if (zScore > 0) return 50
  if (zScore > -1) return 16
  if (zScore > -2) return 3
  return 1
}
