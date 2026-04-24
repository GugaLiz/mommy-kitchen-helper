const api = require('../../utils/api')

Page({
  data: {
    currentBaby: {},
    babies: [],
    today: {},
    hasConfirmedWeeklyPlan: false,
    showPlanPicker: false,
    planRecipeGroups: [],
    selectedPlanRecipeIds: [],
    loadingPlanPicker: false
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    api.getOverview().then(res => {
      if (!res.currentBaby) {
        wx.navigateTo({ url: '/pages/baby-edit/index?mode=create' })
        return
      }
      this.setData({
        currentBaby: res.currentBaby,
        babies: res.babies,
        today: res.todayRecommendation,
        hasConfirmedWeeklyPlan: !!res.hasConfirmedWeeklyPlan
      })
    })
  },

  handleSwitchBaby() {
    const items = this.data.babies.map(item => item.nickname)
    wx.showActionSheet({
      itemList: items,
      success: ({ tapIndex }) => {
        const baby = this.data.babies[tapIndex]
        api.switchBaby(baby.id).then(() => this.loadData())
      }
    })
  },

  swapMeal(event) {
    const mealType = event.currentTarget.dataset.type
    api.swapMeal(this.data.currentBaby.id, mealType).then(today => {
      this.setData({ today })
    })
  },

  openRecipe(event) {
    const type = event.currentTarget.dataset.type
    const recipe = this.data.today[type]
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` })
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${event.detail.id}` })
  },

  openWeeklyPlan() {
    this.setData({ showPlanPicker: true, loadingPlanPicker: true })
    Promise.all([
      api.getMyRecipes('collection').catch(() => []),
      api.getMyRecipes('made').catch(() => []),
      api.getMyRecipes('created').catch(() => [])
    ]).then(([collections, made, created]) => {
      this.setData({
        loadingPlanPicker: false,
        planRecipeGroups: [
          { key: 'collection', title: '我的收藏', recipes: collections.map(item => ({ ...item, checked: this.data.selectedPlanRecipeIds.includes(item.id) })) },
          { key: 'made', title: '做过食谱', recipes: made.map(item => ({ ...item, checked: this.data.selectedPlanRecipeIds.includes(item.id) })) },
          { key: 'created', title: '我的食谱', recipes: created.map(item => ({ ...item, checked: this.data.selectedPlanRecipeIds.includes(item.id) })) }
        ]
      })
    })
  },

  closePlanPicker() {
    this.setData({
      showPlanPicker: false,
      selectedPlanRecipeIds: []
    })
  },

  togglePlanRecipe(event) {
    const recipeId = event.currentTarget.dataset.id
    const selected = this.data.selectedPlanRecipeIds.slice()
    const index = selected.indexOf(recipeId)
    if (index >= 0) {
      selected.splice(index, 1)
    } else {
      selected.push(recipeId)
    }
    this.setData({
      selectedPlanRecipeIds: selected,
      planRecipeGroups: this.data.planRecipeGroups.map(group => ({
        ...group,
        recipes: group.recipes.map(item => ({
          ...item,
          checked: selected.includes(item.id)
        }))
      }))
    })
  },

  generateWeeklyPlanWithSelection() {
    const requiredRecipeIds = this.data.selectedPlanRecipeIds.slice()
    api.refreshWeeklyPlan(this.data.currentBaby.id, { requiredRecipeIds }).then(() => {
      this.setData({ showPlanPicker: false, selectedPlanRecipeIds: [] })
      wx.navigateTo({ url: '/pages/weekly-plan/index' })
    })
  },

  viewWeeklyPlan() {
    wx.navigateTo({ url: '/pages/weekly-plan/index' })
  },

  goGrowth() {
    wx.switchTab({ url: '/pages/growth/index' })
  },

  openMyContent(event) {
    const type = event.currentTarget.dataset.type
    wx.setStorageSync('recipes_list_mode', type)
    wx.switchTab({ url: '/pages/recipes/index' })
  }
})
