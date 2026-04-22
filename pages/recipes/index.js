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

  goDetail(event) {
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${event.detail.id}` })
  }
})
