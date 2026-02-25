> **当前状态**: ✅ **已实现 (Implemented)**
> **最后复盘**: 2026-02-25
> **说明**: V1.8.0 引入了 `ssoToken` 机制，支持 Supabase 格式与 Standard JWT 格式的 Token 交付。V1.8.6 中，Token 的生成逻辑已封装在 `authService` 中，支持多应用密钥。

# SSO 阶段 2（令牌与交付）

## 目标
- 规范 token 交付模式
- 最小化 token 暴露风险
- 明确刷新与失效策略

## 改造范围
- 子应用回跳交付规范
- Account 侧 token 交付策略

## 技术选型
- Supabase Session
- 现有 auth_mode 机制扩展

## 风险评估
- 中：涉及认证链路与子应用接入

## 回滚方案
- 回退至 fragment 模式直传

## 验收标准
- token 交付方式统一
- 回跳后可稳定建立 session

## 进度
- 状态: 已完成
- 已完成: token 交付统一、exchange 交付通道、回跳规范更新、单元测试
