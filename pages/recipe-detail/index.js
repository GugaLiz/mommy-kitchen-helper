const api = require('../../utils/api')
const store = require('../../utils/store')

Page({
  data: {
    recipe: {},
    collectText: '收藏食谱'
  },

  onLoad(options) {
    this.recipeId = options.id
  },

  onShow() {
    this.loadDetail()
  },

  loadDetail() {
    api.getRecipeDetail(this.recipeId).then(recipe => {
      this.setData({
        recipe,
        collectText: recipe.isCollected ? '取消收藏' : '收藏食谱'
      })
    })
  },

  toggleCollect() {
    api.toggleCollection(this.recipeId).then(isCollected => {
      wx.showToast({
        title: isCollected ? '已加入收藏' : '已取消收藏',
        icon: 'none'
      })
      this.loadDetail()
    })
  },

  markDone() {
    const currentBaby = store.getCurrentBaby(store.getState())
    api.markRecipeMade(this.recipeId, currentBaby.id).then(() => {
      wx.showToast({ title: '已记录做过', icon: 'success' })
      this.loadDetail()
    })
  }
})
