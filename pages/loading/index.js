const auth = require('../../utils/auth')
const store = require('../../utils/store')

Page({
  data: {
    loading: false
  },

  onShow() {
    const state = store.getState()
    if (state.isLoggedIn) {
      wx.switchTab({ url: '/pages/home/index' })
    }
  },

  handleLogin() {
    if (this.data.loading) return
    this.proceedLoginWithPrivacy()
  },

  openUserAgreement() {
    wx.navigateTo({ url: '/pages/agreement-user/index' })
  },

  openPrivacyAgreement() {
    if (typeof wx.openPrivacyContract === 'function') {
      wx.openPrivacyContract({
        success: () => {},
        fail: () => {
          wx.navigateTo({ url: '/pages/agreement-privacy/index' })
        }
      })
      return
    }

    wx.navigateTo({ url: '/pages/agreement-privacy/index' })
  },

  proceedLoginWithPrivacy() {
    if (typeof wx.requirePrivacyAuthorize === 'function') {
      wx.requirePrivacyAuthorize({
        success: () => {
          this.proceedLogin()
        },
        fail: () => {
          wx.showToast({
            title: '请先同意隐私保护指引',
            icon: 'none'
          })
        }
      })
      return
    }

    this.proceedLogin()
  },

  proceedLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })

    auth.wechatLogin()
      .then(() => {
        const currentBaby = store.getCurrentBaby(store.getState())
        if (!currentBaby) {
          wx.redirectTo({ url: '/pages/baby-edit/index?mode=create' })
          return
        }

        wx.switchTab({ url: '/pages/home/index' })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  }
})
