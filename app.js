const store = require('./utils/store')

App({
  globalData: {
    appName: '育儿助手'
  },

  onLaunch() {
    store.initialize()
  }
})
