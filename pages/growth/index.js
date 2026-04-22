const api = require('../../utils/api')
const store = require('../../utils/store')
const { formatDate } = require('../../utils/format')

Page({
  data: {
    baby: {},
    latestRecord: {},
    change: {},
    records: [],
    historyRecords: [],
    analysis: '',
    recommendationCards: [],
    chartData: null,
    measureLabel: '身高',
    showForm: false,
    form: {
      measuredDate: formatDate(new Date()),
      height: '',
      weight: ''
    }
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const currentBaby = store.getCurrentBaby(store.getState())
    if (!currentBaby) {
      wx.navigateTo({ url: '/pages/baby-edit/index?mode=create' })
      return
    }
    api.getGrowthData(currentBaby.id).then(res => {
      this.setData({
        baby: res.baby,
        latestRecord: res.latestRecord || {},
        change: res.change,
        records: res.records,
        historyRecords: res.records.slice().reverse(),
        analysis: res.analysis,
        recommendationCards: res.recommendationCards,
        chartData: res.chartData || null,
        measureLabel: res.measureLabel || '身高'
      })
    })
  },

  switchBaby() {
    const state = store.getState()
    wx.showActionSheet({
      itemList: state.babies.map(item => item.nickname),
      success: ({ tapIndex }) => {
        api.switchBaby(state.babies[tapIndex].id).then(() => this.loadData())
      }
    })
  },

  toggleForm() {
    this.setData({ showForm: !this.data.showForm })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleDateChange(event) {
    this.setData({
      'form.measuredDate': event.detail.value
    })
  },

  saveRecord() {
    const { measuredDate, height, weight } = this.data.form
    if (!height || !weight) {
      wx.showToast({ title: '请填写完整数据', icon: 'none' })
      return
    }
    api.addGrowthRecord(this.data.baby.id, { measuredDate, height, weight }).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({
        showForm: false,
        form: {
          measuredDate: formatDate(new Date()),
          height: '',
          weight: ''
        }
      })
      this.loadData()
    })
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/recipe-detail/index?id=${event.detail.id}` })
  }
})
