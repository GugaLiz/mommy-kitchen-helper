const api = require('../../utils/api')

const MODE_TEXT_MAP = {
  all: {
    title: '食谱库',
    subtitle: ''
  },
  collection: {
    title: '我的收藏',
    subtitle: '这里是你已收藏的食谱'
  },
  made: {
    title: '做过食谱',
    subtitle: '这里是你已记录做过的食谱'
  },
  created: {
    title: '我的食谱',
    subtitle: '这里是你自己记录和分享的食谱'
  }
}

Page({
  data: {
    recipes: [],
    keyword: '',
    ageRange: '全部',
    tag: '全部',
    listMode: 'all',
    pageTitle: '食谱库',
    pageSubtitle: '',
    ageRanges: ['全部', '6-8月', '8-10月', '10-12月', '1-2岁', '2-3岁', '3岁+'],
    tags: ['全部', '补铁', '补钙', '手指食物', '易消化', '补蛋白', '增重']
  },

  onLoad(options = {}) {
    this.applyMode(options.mode || 'all')
  },

  onShow() {
    const pendingMode = wx.getStorageSync('recipes_list_mode')
    if (pendingMode) {
      wx.removeStorageSync('recipes_list_mode')
      this.applyMode(pendingMode)
    }
    this.loadRecipes()
  },

  applyMode(mode) {
    const listMode = mode || 'all'
    const current = MODE_TEXT_MAP[listMode] || MODE_TEXT_MAP.all
    this.setData({
      listMode,
      pageTitle: current.title,
      pageSubtitle: current.subtitle
    })
    wx.setNavigationBarTitle({
      title: current.title
    })
  },

  loadRecipes() {
    const requestTask = this.data.listMode === 'all'
      ? api.getRecipes({
        keyword: this.data.keyword,
        ageRange: this.data.ageRange,
        tag: this.data.tag
      })
      : api.getMyRecipes(this.data.listMode)

    requestTask.then(recipes => {
      this.setData({ recipes })
    })
  },

  handleKeyword(event) {
    this.setData({ keyword: event.detail.value })
    this.loadRecipes()
  },

  selectAge(event) {
    this.setData({ ageRange: event.currentTarget.dataset.value })
    this.loadRecipes()
  },

  selectTag(event) {
    this.setData({ tag: event.currentTarget.dataset.value })
    this.loadRecipes()
  },

  backToAll() {
    this.applyMode('all')
    this.loadRecipes()
  },

  goAddRecipe() {
    wx.navigateTo({ url: '/pages/recipe-add/index' })
  },

  editRecipe(event) {
    wx.navigateTo({ url: `/pages/recipe-add/index?mode=edit&id=${event.detail.id}` })
  },

  toggleRecipeVisibility(event) {
    const { id, isPublic } = event.detail
    const nextPublic = !isPublic
    wx.showModal({
      title: nextPublic ? '改为公开？' : '改为私密？',
      content: nextPublic
        ? '公开后，这道食谱后续可以分享给其他用户查看。'
        : '私密后，只有你自己可以在“我的食谱”里查看。',
      confirmText: nextPublic ? '改为公开' : '改为私密',
      success: ({ confirm }) => {
        if (!confirm) return
        api.updateRecipeVisibility(id, nextPublic).then(() => {
          wx.showToast({ title: nextPublic ? '已公开' : '已设为私密', icon: 'success' })
          this.loadRecipes()
        })
      }
    })
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${event.detail.id}` })
  }
})
