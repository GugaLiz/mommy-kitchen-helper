const api = require('../../utils/api')
const store = require('../../utils/store')
const { ensurePersistableAvatar } = require('../../utils/avatar')

function getDefaultAvatar(gender) {
  return gender === '女' ? '/assets/avatars/girl-q.svg' : '/assets/avatars/boy-q.svg'
}

Page({
  data: {
    mode: 'create',
    modeTitle: '创建宝宝档案',
    genders: ['男', '女'],
    allergyOptions: [],
    preferenceOptions: [],
    allergySource: ['牛奶', '鸡蛋', '海鲜', '坚果', '小麦', '大豆'],
    preferenceSource: ['爱吃肉', '爱吃蔬菜', '爱吃水果', '不爱吃蔬菜', '不爱吃肉'],
    addingAllergy: false,
    addingPreference: false,
    newAllergy: '',
    newPreference: '',
    form: {
      nickname: '',
      gender: '男',
      birthDate: '',
      allergies: [],
      dietaryPreferences: [],
      avatarImage: '/assets/avatars/boy-q.svg',
      active: false
    }
  },

  onLoad(options) {
    const mode = options.mode || 'create'
    const nextData = {
      mode,
      modeTitle: mode === 'create' ? '创建宝宝档案' : '编辑宝宝档案'
    }

    if (options.id) {
      const state = store.getState()
      const target = state.babies.find(item => item.id === options.id)
      if (target) {
        nextData.form = {
          ...target,
          avatarImage: target.avatarImage || getDefaultAvatar(target.gender)
        }
      }
    }

    this.setData(nextData, () => this.refreshOptionStates())
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleDateChange(event) {
    this.setData({
      'form.birthDate': event.detail.value
    })
  },

  selectGender(event) {
    const gender = event.currentTarget.dataset.value
    const currentAvatar = this.data.form.avatarImage
    const previousDefault = getDefaultAvatar(this.data.form.gender)
    const nextDefault = getDefaultAvatar(gender)

    this.setData({
      'form.gender': gender,
      'form.avatarImage': currentAvatar === previousDefault ? nextDefault : currentAvatar
    })
  },

  handleChooseAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl
    if (avatarUrl) {
      this.setData({
        'form.avatarImage': avatarUrl
      })
      return
    }

    this.chooseAvatar()
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'form.avatarImage': res.tempFilePaths[0]
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

  toggleAllergy(event) {
    this.toggleArrayField('allergies', event.currentTarget.dataset.value)
  },

  togglePreference(event) {
    this.toggleArrayField('dietaryPreferences', event.currentTarget.dataset.value)
  },

  toggleArrayField(field, value) {
    const list = this.data.form[field].slice()
    const index = list.indexOf(value)
    if (index > -1) {
      list.splice(index, 1)
    } else {
      list.push(value)
    }
    this.setData({ [`form.${field}`]: list }, () => this.refreshOptionStates())
  },

  refreshOptionStates() {
    this.setData({
      allergyOptions: this.data.allergySource.map(value => ({
        value,
        active: this.data.form.allergies.includes(value)
      })),
      preferenceOptions: this.data.preferenceSource.map(value => ({
        value,
        active: this.data.form.dietaryPreferences.includes(value)
      }))
    })
  },

  startAddAllergy() {
    this.setData({ addingAllergy: true })
  },

  startAddPreference() {
    this.setData({ addingPreference: true })
  },

  handleNewAllergyInput(event) {
    this.setData({ newAllergy: event.detail.value })
  },

  handleNewPreferenceInput(event) {
    this.setData({ newPreference: event.detail.value })
  },

  confirmAddAllergy() {
    const value = (this.data.newAllergy || '').trim()
    if (!value) return

    if (this.data.allergySource.includes(value)) {
      this.toggleArrayField('allergies', value)
      this.setData({ addingAllergy: false, newAllergy: '' })
      return
    }

    this.setData({
      allergySource: this.data.allergySource.concat(value),
      'form.allergies': this.data.form.allergies.concat(value),
      addingAllergy: false,
      newAllergy: ''
    }, () => this.refreshOptionStates())
  },

  confirmAddPreference() {
    const value = (this.data.newPreference || '').trim()
    if (!value) return

    if (this.data.preferenceSource.includes(value)) {
      this.toggleArrayField('dietaryPreferences', value)
      this.setData({ addingPreference: false, newPreference: '' })
      return
    }

    this.setData({
      preferenceSource: this.data.preferenceSource.concat(value),
      'form.dietaryPreferences': this.data.form.dietaryPreferences.concat(value),
      addingPreference: false,
      newPreference: ''
    }, () => this.refreshOptionStates())
  },

  async saveBaby() {
    if (!this.data.form.nickname || !this.data.form.birthDate) {
      wx.showToast({ title: '请填写昵称和出生日期', icon: 'none' })
      return
    }

    let avatarImage = this.data.form.avatarImage
    try {
      avatarImage = await ensurePersistableAvatar(avatarImage)
    } catch (error) {
      wx.showToast({ title: '头像处理失败，请重新选择', icon: 'none' })
      return
    }

    const payload = {
      ...this.data.form,
      avatarImage,
      active: true
    }

    api.saveBaby(payload).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => {
            wx.switchTab({ url: '/pages/mine/index' })
          }
        })
      }, 300)
    })
  }
})
