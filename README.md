# mommy-kitchen-helper
这是一个专注0-3岁小孩辅食内容包括食谱，排敏记录和记录身高体重的小程序

## Supabase 当前状态

- 已创建项目: https://eoavogkcjuextdsprzuh.supabase.co
- 已执行基础建表: [supabase/schema.sql](supabase/schema.sql)

## 下一步（建议按顺序执行）

1. 补充环境变量
- 复制 [.env.example](.env.example) 为 .env.local
- 填入 SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY、微信小程序密钥

2. 按顺序执行数据库脚本
- 执行顺序见 [supabase/执行顺序与联调清单.md](G:\works\liuli\mommy-kitchen-helper\supabase\执行顺序与联调清单.md)

3. 执行增量迁移（auth_user_id 绑定 + updated_at 触发器）
- 执行 [supabase/migrations/20260330_add_auth_user_id.sql](supabase/migrations/20260330_add_auth_user_id.sql)

4. 启用并应用 RLS 策略
- 执行 [supabase/rls.sql](supabase/rls.sql)

5. 导入食谱种子数据
- 执行 [supabase/seed.sql](supabase/seed.sql)

6. 控制台检查项
- Authentication: 开启你要用的登录方式（建议先 Email 或手机号用于开发联调）
- Database: 确认 users.auth_user_id 已有索引与外键
- API: 记录 Project URL 与 anon key（小程序端使用）

## 建议的联调顺序

1. 先跑通 users 与 babies 的读写
2. 再接 growth_records 曲线数据
3. 最后接 recipes 与推荐逻辑

## 说明

- 小程序端不要暴露 service role key
- service role key 仅用于后端服务或 Edge Functions
- 完整 SQL 执行顺序与联调步骤见 [supabase/执行顺序与联调清单.md](G:\works\liuli\mommy-kitchen-helper\supabase\执行顺序与联调清单.md)


