const api = require('../../utils/api')

Page({
  data: {
    baby: {},
    plan: [],
    shoppingList: [],
    showList: false
  },

  onShow() {
    api.getOverview().then(overview => {
      if (!overview.currentBaby) {
        wx.navigateTo({ url: '/pages/baby-edit/index?mode=create' })
        return
      }
      this.setData({ baby: overview.currentBaby })
      this.loadPlan()
    })
  },

  loadPlan() {
    api.getWeeklyPlan(this.data.baby.id).then(plan => {
      this.setData({ plan })
    })
  },

  refreshPlan() {
    api.refreshWeeklyPlan(this.data.baby.id).then(plan => {
      this.setData({ plan })
      wx.showToast({ title: '已更新本周计划', icon: 'success' })
    })
  },

  showShoppingList() {
    api.buildShoppingList(this.data.baby.id).then(shoppingList => {
      this.setData({ shoppingList, showList: true })
    })
  },

  hideShoppingList() {
    this.setData({ showList: false })
  }
})
