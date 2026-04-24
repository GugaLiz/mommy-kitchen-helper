# 后端认证服务 - Node.js + Express + Supabase

Node.js 后端完整实现，处理微信小程序的认证、登录、用户管理。

## 环境变量 (.env)

```bash
# Supabase
SUPABASE_URL=https://eoavogkcjuextdsprzuh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 微信小程序
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=your_app_secret_here

# JWT 签名密钥
JWT_SECRET=your_jwt_secret_key_here

# 服务器配置
PORT=3333
CORS_ORIGIN=http://localhost:3333
NODE_ENV=development

# 开发调试开关（生产环境务必关闭）
DEV_LOGIN_ENABLED=true

# 可选：日志级别
LOG_LEVEL=debug
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入真实的密钥和 ID

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3333` 启动

### 4. 运行 smoke test

```bash
npm run smoke
```

这个脚本会自动：

- 启动本地 Express 服务
- 调用 `dev-login`
- 串行验证宝宝、食谱、收藏、做过、生长记录、今日推荐、换餐、周计划、备菜清单

如果失败，优先检查：

- Supabase 项目是否可访问
- SQL 迁移和 `seed.sql` 是否已执行
- `.env.local` 中的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 是否正确

## 联调前置

在启动后端前，建议先按顺序执行数据库脚本：

- [supabase/schema.sql](G:\works\liuli\mommy-kitchen-helper\supabase\schema.sql)
- [supabase/migrations/20260330_add_auth_user_id.sql](G:\works\liuli\mommy-kitchen-helper\supabase\migrations\20260330_add_auth_user_id.sql)
- [supabase/migrations/20260421_add_made_recipes.sql](G:\works\liuli\mommy-kitchen-helper\supabase\migrations\20260421_add_made_recipes.sql)
- [supabase/rls.sql](G:\works\liuli\mommy-kitchen-helper\supabase\rls.sql)
- [supabase/seed.sql](G:\works\liuli\mommy-kitchen-helper\supabase\seed.sql)

完整步骤见 [supabase/执行顺序与联调清单.md](G:\works\liuli\mommy-kitchen-helper\supabase\执行顺序与联调清单.md)

## API 端点

### 1. 微信登录

**POST** `/api/auth/wechat-login`

小程序调用 `wx.login()` 获得 code，发送给后端。

**Request:**
```json
{
  "code": "061xxx",
  "userInfo": {
    "nickName": "张三",
    "avatarUrl": "https://wx.qlogo.cn/...",
    "phoneNumber": "13800138000"
  }
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user_id": "uuid",
    "auth_user_id": "uuid",
    "openid": "oxxxxxxx",
    "nickname": "张三"
  }
}
```

### 2. 获取用户信息

**GET** `/api/auth/profile`

需要在 Header 中提供 Bearer Token

**Request Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "wechat_openid": "oxxxxxxx",
    "nickname": "张三",
    "avatar_url": "https://...",
    "created_at": "2026-03-30T...",
    "last_login_at": "2026-03-30T..."
  }
}
```

### 3. 登出

**POST** `/api/auth/logout`

**Request Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "code": 0,
  "message": "Logout successful"
}
```

### 4. 开发登录（无需微信 code）

**POST** `/api/auth/dev-login`

仅用于本地开发联调，受 `DEV_LOGIN_ENABLED` 控制。

**Request:**
```json
{
  "openid": "dev_openid_demo_001",
  "nickname": "开发测试用户"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Dev login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user_id": "uuid",
    "auth_user_id": "uuid",
    "openid": "dev_openid_demo_001",
    "nickname": "开发测试用户"
  }
}
```

## 小程序侧调用示例

```javascript
// 登录
async function handleWechatLogin() {
  const { code } = await new Promise((resolve, reject) => {
    wx.login({
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })

  const response = await fetch('http://your-backend.com/api/auth/wechat-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })

  const result = await response.json()
  
  // 保存 token
  wx.setStorageSync('supabase_token', result.data.token)
}

// 调用需要认证的 API
async function getProfile() {
  const token = wx.getStorageSync('supabase_token')
  
  const response = await fetch('http://your-backend.com/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const result = await response.json()
  console.log(result.data)
}
```

## 文件结构

```
backend/
├── app.js                    # 主应用文件
├── routes/
│   └── auth.js               # 认证路由处理
├── services/
│   ├── wechat.js             # 微信 API 调用
│   └── supabaseAuth.js       # Supabase 认证逻辑
├── package.json
└── .env                       # 环境变量（本地）
```

## 关键流程

### 微信登录流程

```
小程序 wx.login() 
  ↓
后端 /api/auth/wechat-login (code)
  ↓
微信服务器 code2session (code → openid)
  ↓
后端查询 users 表 (openid)
  ├→ 用户存在 → 返回 token
  └→ 用户不存在 → 创建 Supabase auth user → 创建 profile → 返回 token
  ↓
小程序保存 token 到 storage
  ↓
后续 API 请求带上 token (Authorization: Bearer token)
```

### 数据库绑定

- `auth.users` (Supabase 内置)
- `public.users` (自定义表，存储扩展信息)
  - Foreign Key: `auth_user_id` → `auth.users(id)`
  - Unique: `wechat_openid`

## 部署建议

### 方案 1: Supabase Edge Function (推荐)

改造 `backend/routes/auth.js` 为 Edge Function 风格，直接部署到 Supabase，无需维护额外服务器。

### 方案 2: 云函数（AWS Lambda / 阿里云函数计算）

将 Express app 改为函数处理器，部署到云厂商的无服务器平台。

### 方案 3: VPS / 裸机

- 部署 Node.js 服务
- 使用 PM2 进程管理
- 配置 Nginx 反向代理
- SSL 证书（Let's Encrypt）

### 方案 4: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3333
CMD ["npm", "start"]
```

### 推荐发布步骤（当前项目可直接执行）

#### 1. 准备生产环境变量

在部署平台中配置：

```bash
SUPABASE_URL=你的 Supabase URL
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
WECHAT_APP_ID=你的小程序 AppID
WECHAT_APP_SECRET=你的小程序 AppSecret
JWT_SECRET=一串足够长的随机密钥
PORT=3333
NODE_ENV=production
DEV_LOGIN_ENABLED=false
```

如果部署平台需要额外配置允许来源，可再补：

```bash
CORS_ORIGIN=https://你的后端域名
```

#### 2. 构建并启动 Docker

```bash
cd backend
docker build -t mommy-kitchen-helper-api .
docker run -d \
  --name mommy-kitchen-helper-api \
  -p 3333:3333 \
  --env-file .env \
  mommy-kitchen-helper-api
```

#### 3. 检查服务是否启动成功

```bash
curl http://127.0.0.1:3333/health
```

返回：

```json
{ "status": "ok" }
```

#### 4. 小程序联调时需要同步修改

- 小程序请求地址改成你部署后的 HTTPS 域名，例如：
  `https://api.your-domain.com/api`
- 在微信公众平台的小程序后台，把该域名加入：
  - `request 合法域名`
- 如果你要测试登录、复制、头像上传等能力，也要确保对应隐私协议和域名配置已同步完成

#### 5. 发布前检查清单

- `DEV_LOGIN_ENABLED=false`
- 线上环境变量已完整配置
- Supabase migration 已全部执行
- `https://你的域名/health` 可访问
- 小程序 `request` 合法域名已配置
- 小程序隐私协议已更新

## 安全注意事项

1. **保护密钥**
   - `SUPABASE_SERVICE_ROLE_KEY` 仅在后端使用，不要暴露给前端
   - `JWT_SECRET` 妥善保管，定期轮换
   - `WECHAT_APP_SECRET` 绝对保密

2. **速率限制**
   - 给登录接口添加速率限制防止穷举
   - 使用 `express-rate-limit` 中间件

3. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 所有敏感信息需要加密传输

4. **Token 验证**
   - 验证 JWT 签名和过期时间
   - 黑名单管理已登出的 token

5. **输入验证**
   - 验证 code 格式
   - 验证用户信息完整性
   - 防止 SQL 注入

## 常见问题

**Q: 为什么需要后端？**
A: 微信 APP_SECRET 不能在小程序中使用，必须在后端保管。同时，后端可以集中处理业务逻辑、安全验证、数据权限控制。

**Q: Token 多久过期？**
A: 默认 7 天。可在代码中修改 `exp` 字段，建议生产环境 1 天。

**Q: 支持多个小程序吗？**
A: 支持。不同 WECHAT_APP_ID 对应不同的用户空间，通过 `wechat_openid` 区分。

**Q: 离线支持？**
A: 小程序可缓存 token，使用 Supabase Offline-first 库，后端提供数据同步接口。
