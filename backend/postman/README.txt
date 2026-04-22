Postman 快速使用

1. 导入集合文件
   mommy-kitchen-helper-auth.postman_collection.json

2. 导入环境文件
   local-dev.postman_environment.json

3. 选择环境并修改变量
   - baseUrl: 本地默认 http://localhost:3000
   - wxCode: 替换为小程序 wx.login 获取的 code
   - devOpenid: 本地开发登录用标识，固定值可复用同一测试账号

4. 按顺序执行
   - Auth - Dev Login (No WeChat)  (本地推荐)
   - Auth - WeChat Login
   - Auth - Get Profile
   - Auth - Logout

说明
- 登录请求测试脚本会自动把响应中的 data.token 存到集合变量 token。
- 如果你在微信真实环境之外测试，wxCode 会无效，接口应返回明确错误信息。
- Dev Login 依赖后端环境变量 DEV_LOGIN_ENABLED=true，仅用于开发环境。