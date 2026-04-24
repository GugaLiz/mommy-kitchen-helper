/**
 * Express 服务器主文件
 * 完整的认证服务后端示例
 */

import express from 'express'
import cors from 'cors'
import './lib/load-env.js'
import authRoutes from './routes/auth.js'
import babyRoutes from './routes/baby.js'
import familyRoutes from './routes/family.js'
import growthRoutes from './routes/growth.js'
import recipeRoutes from './routes/recipe.js'
import recommendationRoutes from './routes/recommendation.js'
import weeklyPlanRoutes from './routes/weekly-plan.js'
import { fileURLToPath } from 'node:url'

export function createApp() {
  const app = express()

  // 中间件
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))

  // 请求日志中间件
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  // API 路由
  app.use('/api/auth', authRoutes)
  app.use('/api/baby', babyRoutes)
  app.use('/api/family', familyRoutes)
  app.use('/api/growth-record', growthRoutes)
  app.use('/api/recipe', recipeRoutes)
  app.use('/api/recommendation', recommendationRoutes)
  app.use('/api/weekly-plan', weeklyPlanRoutes)

  // 错误处理中间件
  app.use((err, req, res, next) => {
    console.error('[Error]', err)

    res.status(err.status || 500).json({
      code: err.status || 500,
      message: err.message || 'Internal server error'
    })
  })

  return app
}

export function startServer(port = process.env.PORT || 3000) {
  const app = createApp()
  return app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`)
    console.log(`📝 WeChat App ID: ${process.env.WECHAT_APP_ID}`)
    console.log(`🌐 Supabase URL: ${process.env.SUPABASE_URL}`)
  })
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isDirectRun) {
  startServer()
}
