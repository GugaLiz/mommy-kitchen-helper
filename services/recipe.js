/**
 * 食谱和收藏服务
 * 查询食谱、收藏、搜索、筛选
 */

import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../utils/auth'
import { calculateAgeMonths } from './baby'

/**
 * 获取食谱列表（按月龄和标签筛选）
 * @param {number} ageMonths - 宝宝月龄
 * @param {Array<string>} tags - 筛选标签
 * @param {number} page - 分页
 * @param {number} pageSize - 每页数量
 */
export async function getRecipes(ageMonths, tags = [], page = 1, pageSize = 20) {
  try {
    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .lte('min_age_months', ageMonths)
      .gte('max_age_months', ageMonths)

    // 标签过滤
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return {
      recipes: data || [],
      total: count || 0,
      page,
      pageSize
    }
  } catch (error) {
    console.error('Get recipes failed:', error)
    throw error
  }
}

/**
 * 搜索食谱
 */
export async function searchRecipes(keyword, ageMonths, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .ilike('name', `%${keyword}%`)
      .lte('min_age_months', ageMonths)
      .gte('max_age_months', ageMonths)
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Search recipes failed:', error)
    throw error
  }
}

/**
 * 获取食谱详情
 */
export async function getRecipe(recipeId) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get recipe failed:', error)
    throw error
  }
}

/**
 * 收藏食谱
 */
export async function collectRecipe(recipeId) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { data, error } = await supabase
      .from('recipe_collections')
      .insert([
        {
          user_id: userId,
          recipe_id: recipeId
        }
      ])
      .select()

    if (error) {
      if (error.code === '23505') {
        // 已收藏，忽略
        return null
      }
      throw error
    }

    return data[0]
  } catch (error) {
    console.error('Collect recipe failed:', error)
    throw error
  }
}

/**
 * 取消收藏
 */
export async function uncollectRecipe(recipeId) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { error } = await supabase
      .from('recipe_collections')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Uncollect recipe failed:', error)
    throw error
  }
}

/**
 * 检查食谱是否已收藏
 */
export async function isRecipeCollected(recipeId) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      return false
    }

    const { data, error } = await supabase
      .from('recipe_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Check collected failed:', error)
    return false
  }
}

/**
 * 获取用户的所有收藏
 */
export async function getCollectedRecipes(page = 1, pageSize = 20) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('User not logged in')
    }

    const { data, error, count } = await supabase
      .from('recipe_collections')
      .select('recipes(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return {
      recipes: (data || []).map(item => item.recipes),
      total: count || 0,
      page,
      pageSize
    }
  } catch (error) {
    console.error('Get collected recipes failed:', error)
    throw error
  }
}

/**
 * 基于宝宝月龄和过敏源推荐食谱
 */
export async function getRecommendedRecipes(babyId, babyData, limit = 6) {
  try {
    const ageMonths = calculateAgeMonths(babyData.birth_date)
    const allergens = babyData.allergies || []

    let query = supabase
      .from('recipes')
      .select('*')
      .lte('min_age_months', ageMonths)
      .gte('max_age_months', ageMonths)

    // 排除过敏源
    if (allergens.length > 0) {
      for (const allergen of allergens) {
        query = query.not('allergens', 'cs', `[${allergen}]`)
      }
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get recommended recipes failed:', error)
    return []
  }
}
