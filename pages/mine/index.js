const api = require('../../utils/api')
const { ensurePersistableAvatar } = require('../../utils/avatar')

Page({
  data: {
    user: {},
    babies: [],
    collectionsCount: 0,
    madeCount: 0,
    showProfileEditor: false,
    profileForm: {
      nickname: '',
      bio: '',
      avatarImage: ''
    }
  },

  onShow() {
    api.getOverview().then((overview) => {
      this.setData({
        user: overview.user,
        babies: overview.babies,
        collectionsCount: overview.collectionsCount,
        madeCount: overview.madeCount,
        profileForm: {
          nickname: overview.user.nickname || '',
          bio: overview.user.bio || '',
          avatarImage: overview.user.avatarImage || ''
        }
      })
    })
  },

  openProfileEditor() {
    this.setData({ showProfileEditor: true })
  },

  closeProfileEditor() {
    this.setData({ showProfileEditor: false })
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'profileForm.avatarImage': res.tempFilePaths[0]
        })
      },
      fail: () => {
        wx.showToast({
          title: '未选择头像',
          icon: 'none'
        })
      }
    })
  },

  handleChooseAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl
    if (avatarUrl) {
      this.setData({
        'profileForm.avatarImage': avatarUrl
      })
      return
    }

    this.chooseAvatar()
  },

  editNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称，最多10字',
      success: ({ confirm, content }) => {
        if (!confirm) return
        this.setData({
          'profileForm.nickname': (content || '').slice(0, 10)
        })
      }
    })
  },

  editBio() {
    wx.showModal({
      title: '修改个人说明',
      editable: true,
      placeholderText: '请输入个人说明，最多15字',
      success: ({ confirm, content }) => {
        if (!confirm) return
        this.setData({
          'profileForm.bio': (content || '').slice(0, 15)
        })
      }
    })
  },

  async saveProfile() {
    let avatarImage = this.data.profileForm.avatarImage
    try {
      avatarImage = await ensurePersistableAvatar(avatarImage)
    } catch (error) {
      wx.showToast({ title: '头像处理失败，请重新选择', icon: 'none' })
      return
    }

    const profileForm = {
      ...this.data.profileForm,
      avatarImage
    }

    api.saveUserProfile(profileForm).then((user) => {
      this.setData({
        user,
        profileForm,
        showProfileEditor: false
      })
      wx.showToast({ title: '资料已更新', icon: 'success' })
      this.onShow()
    })
  },

  toggleElderMode(event) {
    api.toggleElderMode(event.detail.value).then(() => {
      this.onShow()
    })
  },

  createBaby() {
    wx.navigateTo({ url: '/pages/baby-edit/index?mode=create' })
  },

  openFamily() {
    wx.navigateTo({ url: '/pages/family/index' })
  },

  editBaby(event) {
    wx.navigateTo({ url: `/pages/baby-edit/index?id=${event.currentTarget.dataset.id}&mode=edit` })
  },

  showCacheNotice() {
    wx.showToast({ title: '当前为真实接口联调', icon: 'none' })
  },

  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '可在后续版本接入表单或客服会话。',
      showCancel: false
    })
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '育儿助手专注 0-3 岁宝宝科学喂养与成长记录。',
      showCancel: false
    })
  }
})
