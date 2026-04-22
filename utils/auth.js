const api = require('./api')

function wechatLogin() {
  return api.login()
}

function weixinLogin() {
  return wechatLogin()
}

module.exports = {
  wechatLogin,
  weixinLogin
}
