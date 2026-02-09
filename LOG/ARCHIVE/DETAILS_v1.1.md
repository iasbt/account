# 归档细节条目 v1.1

## 功能描述
- 并行初始化与熔断机制说明
- 核弹级退出与移动端死循环处理
- Auto-Detox 版本控制与缓存清理
- SSO redirect 回跳流程
- 目录结构与核心文件映射说明
- profiles 与 user_app_access 表结构与触发器
- Vercel SPA rewrite 配置与 404 处理

## 接口变更
- 无对外接口变更记录

## 配置差异
- 依赖版本说明与目录结构补充
- 环境变量仅包含 Supabase URL/Key
- Admin 入口通过直接访问 /admin

## 已知问题
- 缺少前端测试用例
- 接入文档与实际 UI 操作仍需统一

## 回滚方案
- 回滚至上一个稳定标签
- 确认 APP_VERSION 与缓存清理策略同步回退
