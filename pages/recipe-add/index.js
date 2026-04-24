const api = require('../../utils/api')
const store = require('../../utils/store')

const DEFAULT_ICONS = ['🥣', '🍚', '🍜', '🥟', '🥕', '🥦', '🍅', '🥚']
const DEFAULT_TAGS = ['自制食谱', '补铁', '补钙', '增重', '补蛋白', '易消化', '手指食物']
const ICON_RULES = [
  { keywords: ['饭', '粥', '米', '谷'], icons: ['🍚', '🥣', '🌾', '🍙'] },
  { keywords: ['面', '粉', '馄饨', '饺'], icons: ['🍜', '🥟', '🥣', '🍲'] },
  { keywords: ['蛋', '蒸蛋'], icons: ['🥚', '🍳', '🥣', '🧀'] },
  { keywords: ['南瓜', '胡萝卜', '红薯'], icons: ['🎃', '🥕', '🍠', '🥣'] },
  { keywords: ['菜', '西兰花', '菠菜', '青菜'], icons: ['🥦', '🥬', '🥕', '🥣'] },
  { keywords: ['番茄', '西红柿'], icons: ['🍅', '🥣', '🍝', '🍲'] },
  { keywords: ['鱼', '虾', '鳕鱼'], icons: ['🐟', '🦐', '🥣', '🍲'] },
  { keywords: ['牛肉', '鸡肉', '猪肉', '肉'], icons: ['🥩', '🍗', '🥣', '🍚'] },
  { keywords: ['水果', '苹果', '香蕉', '梨'], icons: ['🍎', '🍌', '🍐', '🥣'] }
]

function getIconOptions(name = '') {
  const matched = []
  ICON_RULES.forEach(rule => {
    if (rule.keywords.some(keyword => name.indexOf(keyword) >= 0)) {
      matched.push(...rule.icons)
    }
  })
  return Array.from(new Set(matched.concat(DEFAULT_ICONS))).slice(0, 8)
}

function splitLines(value = '') {
  return String(value)
    .split(/\n|；|;/)
    .map(item => item.trim())
    .filter(Boolean)
}

function parseAgeMonths(value = '') {
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : 6
}

function parseCookingTime(value = '') {
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : 20
}

function parseIngredients(value = '') {
  return splitLines(value).map(line => {
    const parts = line.split(/\s+/)
    if (parts.length >= 2) {
      return {
        name: parts[0],
        quantity: parts.slice(1).join('')
      }
    }
    return {
      name: line,
      quantity: '适量'
    }
  })
}

function parseSteps(value = '') {
  return splitLines(value).map((line, index) => ({
    step: index + 1,
    description: line.replace(/^\d+[.、]\s*/, '')
  }))
}

function joinIngredients(ingredients = []) {
  return ingredients.map(item => `${item.name || ''} ${item.quantity || item.amount || ''}`.trim()).join('\n')
}

function joinSteps(steps = []) {
  return steps.map((item, index) => `${index + 1}. ${typeof item === 'string' ? item : item.description || ''}`).join('\n')
}

Page({
  data: {
    mode: 'create',
    pageTitle: '添加食谱',
    saving: false,
    iconOptions: DEFAULT_ICONS,
    tagOptions: DEFAULT_TAGS.map(value => ({ value, active: value === '自制食谱' })),
    newTag: '',
    form: {
      name: '',
      ageText: '',
      cookingTimeText: '',
      ingredientsText: '',
      stepsText: '',
      tips: '',
      nutritionInfo: '',
      tags: ['自制食谱'],
      isPublic: true,
      imageText: '🥣'
    }
  },

  onLoad(options = {}) {
    if (options.mode === 'edit' && options.id) {
      this.recipeId = options.id
      this.loadRecipeForEdit(options.id)
      return
    }
    wx.setNavigationBarTitle({ title: '添加食谱' })
  },

  loadRecipeForEdit(recipeId) {
    const localRecipe = store.getRecipeById(recipeId)
    if (localRecipe) {
      this.fillRecipe(localRecipe)
    }
    api.getRecipeDetail(recipeId).then(recipe => {
      this.fillRecipe(recipe)
    })
  },

  fillRecipe(recipe) {
    const tags = recipe.tags && recipe.tags.length ? recipe.tags : ['自制食谱']
    const allTags = Array.from(new Set(DEFAULT_TAGS.concat(tags)))
    const name = recipe.name || ''
    this.setData({
      mode: 'edit',
      pageTitle: '编辑食谱',
      iconOptions: getIconOptions(name),
      tagOptions: allTags.map(value => ({ value, active: tags.includes(value) })),
      form: {
        name,
        ageText: recipe.minAgeMonths ? `${recipe.minAgeMonths}月+` : '',
        cookingTimeText: recipe.cookingTime ? `${recipe.cookingTime}分钟` : '',
        ingredientsText: joinIngredients(recipe.ingredients || []),
        stepsText: joinSteps(recipe.steps || []),
        tips: recipe.tips || '',
        nutritionInfo: recipe.nutrition || recipe.nutritionInfo || '',
        tags,
        isPublic: recipe.isPublic !== false,
        imageText: recipe.imageText || '🥣'
      }
    })
    wx.setNavigationBarTitle({ title: '编辑食谱' })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    const value = event.detail.value
    const nextData = {
      [`form.${field}`]: value
    }

    if (field === 'name') {
      const iconOptions = getIconOptions(value)
      nextData.iconOptions = iconOptions
      if (!iconOptions.includes(this.data.form.imageText)) {
        nextData['form.imageText'] = iconOptions[0]
      }
    }

    this.setData(nextData)
  },

  selectIcon(event) {
    this.setData({
      'form.imageText': event.currentTarget.dataset.icon
    })
  },

  toggleTag(event) {
    const value = event.currentTarget.dataset.value
    let tags = this.data.form.tags.slice()
    if (tags.includes(value)) {
      tags = tags.filter(item => item !== value)
    } else {
      tags.push(value)
    }
    if (!tags.length) tags = ['自制食谱']
    this.setData({
      'form.tags': tags,
      tagOptions: this.data.tagOptions.map(item => ({
        ...item,
        active: tags.includes(item.value)
      }))
    })
  },

  handleNewTagInput(event) {
    this.setData({ newTag: event.detail.value })
  },

  addCustomTag() {
    const value = this.data.newTag.trim()
    if (!value) return
    const existing = this.data.tagOptions.map(item => item.value)
    const tagOptions = existing.includes(value)
      ? this.data.tagOptions
      : this.data.tagOptions.concat({ value, active: true })
    const tags = Array.from(new Set(this.data.form.tags.concat(value)))
    this.setData({
      tagOptions: tagOptions.map(item => ({ ...item, active: tags.includes(item.value) })),
      'form.tags': tags,
      newTag: ''
    })
  },

  togglePublic(event) {
    this.setData({
      'form.isPublic': event.detail.value
    })
  },

  submitRecipe() {
    if (this.data.saving) return
    const form = this.data.form
    if (!form.name.trim()) {
      wx.showToast({ title: '请填写食谱名称', icon: 'none' })
      return
    }
    if (!form.ingredientsText.trim() || !form.stepsText.trim()) {
      wx.showToast({ title: '请补充食材和步骤', icon: 'none' })
      return
    }

    const minAgeMonths = parseAgeMonths(form.ageText)
    const payload = {
      name: form.name.trim(),
      minAgeMonths,
      maxAgeMonths: Math.max(minAgeMonths, 72),
      cookingTime: parseCookingTime(form.cookingTimeText),
      tags: form.tags,
      allergens: [],
      ingredients: parseIngredients(form.ingredientsText),
      steps: parseSteps(form.stepsText),
      tips: form.tips.trim(),
      nutritionInfo: form.nutritionInfo.trim(),
      imageText: form.imageText || '🥣',
      isPublic: form.isPublic
    }

    const task = this.data.mode === 'edit'
      ? api.updateRecipe(this.recipeId, payload)
      : api.createRecipe(payload)

    this.setData({ saving: true })
    task
      .then((recipe) => {
        wx.showToast({ title: this.data.mode === 'edit' ? '已更新' : '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })
        }, 300)
      })
      .catch((error) => {
        wx.showToast({ title: error.message || '保存失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  }
})
