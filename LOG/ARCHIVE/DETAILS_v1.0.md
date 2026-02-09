# 归档细节条目 v1.0

## 功能描述
- 认证初始化并行加载与 2 秒超时兜底
- 核弹级退出机制，清空缓存并硬刷新
- Auto-Detox 版本比对与缓存清理
- SSO 登录回跳（redirect 参数）
- AdminGuard 权限守卫与隐藏入口
- profiles 与 user_app_access 表基础结构说明
- Vercel SPA rewrite 配置
- Bug 修复历史记录与处理策略

## 接口变更
- 无对外接口变更记录

## 配置差异
- 需要配置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY
- 需要 vercel.json 以支持 SPA 路由
- APP_VERSION 变更触发缓存清理

## 已知问题
- 缺少自动化测试与回归脚本
- 管理员权限提升需手动操作数据库

## 回滚方案
- 回滚至上一个稳定版本标签
- 同步回滚数据库脚本修改
- 更新 APP_VERSION 触发缓存清理
