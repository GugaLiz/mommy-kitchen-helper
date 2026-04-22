const api = require('../../utils/api')

Page({
  data: {
    currentBaby: {},
    babies: [],
    today: {}
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
        today: res.todayRecommendation
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
