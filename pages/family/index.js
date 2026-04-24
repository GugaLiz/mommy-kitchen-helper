const api = require('../../utils/api')

function formatExpireText(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

Page({
  data: {
    loading: true,
    family: {},
    members: [],
    myRole: '',
    joinCode: '',
    latestInvite: null
  },

  onShow() {
    this.loadFamily()
  },

  loadFamily() {
    this.setData({ loading: true })
    api.getCurrentFamily().then((res) => {
      this.setData({
        loading: false,
        family: res.family || {},
        members: res.members || [],
        myRole: res.myRole || '',
        latestInvite: null
      })
    }).catch((error) => {
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '家庭信息加载失败',
        icon: 'none'
      })
    })
  },

  handleJoinCodeInput(event) {
    this.setData({
      joinCode: String(event.detail.value || '').replace(/\s+/g, '').slice(0, 6)
    })
  },

  generateInvite() {
    api.createFamilyInvite({ role: 'editor', relation: '家人' }).then((invite) => {
      const latestInvite = {
        ...invite,
        code: String(invite.code || ''),
        expireText: formatExpireText(invite.expires_at)
      }
      this.setData({ latestInvite })
      wx.showModal({
        title: '邀请码已生成',
        content: `邀请码：${latestInvite.code}\n有效期至：${latestInvite.expireText || '24小时内'}`,
        showCancel: false
      })
    }).catch((error) => {
      wx.showToast({
        title: error.message || '生成邀请码失败',
        icon: 'none'
      })
    })
  },

  copyInviteCode() {
    const code = String((this.data.latestInvite && this.data.latestInvite.code) || '')
    if (!code) {
      wx.showToast({
        title: '暂无邀请码',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制邀请码',
          icon: 'success'
        })
      },
      fail: (error) => {
        console.error('[family] copy invite failed', error)
        wx.showModal({
          title: '复制失败',
          content: `当前环境暂时无法写入剪贴板。\n邀请码：${code}\n\n请先手动复制使用。`,
          showCancel: false
        })
      }
    })
  },

  confirmJoin() {
    const code = this.data.joinCode
    if (!code || code.length < 6) {
      wx.showToast({
        title: '请输入6位邀请码',
        icon: 'none'
      })
      return
    }

    api.joinFamilyByInvite(code).then(() => {
      wx.showToast({
        title: '已加入家庭',
        icon: 'success'
      })
      this.setData({ joinCode: '' })
      this.loadFamily()
    }).catch((error) => {
      wx.showToast({
        title: error.message || '加入家庭失败',
        icon: 'none'
      })
    })
  },

  editFamilyName() {
    if (this.data.myRole !== 'owner') return
    wx.showModal({
      title: '修改家庭名称',
      editable: true,
      placeholderText: '请输入家庭名称',
      success: ({ confirm, content }) => {
        if (!confirm) return
        const name = String(content || '').trim().slice(0, 20)
        if (!name) {
          wx.showToast({ title: '家庭名称不能为空', icon: 'none' })
          return
        }
        api.updateFamilyName(name).then((res) => {
          this.setData({
            family: res.family || this.data.family,
            members: res.members || this.data.members,
            myRole: res.myRole || this.data.myRole
          })
          wx.showToast({ title: '已更新', icon: 'success' })
        }).catch((error) => {
          wx.showToast({ title: error.message || '修改失败', icon: 'none' })
        })
      }
    })
  }
})
