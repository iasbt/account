# 权限矩阵文档 (Permission Matrix)

## 1. 角色定义 (Roles)

| 角色标识 (Role) | 说明 (Description) | 判定规则 (Criteria) |
| :--- | :--- | :--- |
| **admin** | 系统管理员 | `user.isAdmin === true` |
| **user** | 普通用户 | `user.isAdmin === false` |
| **guest** | 访客 | 未登录用户 |

## 2. 权限定义 (Permissions)

| 权限标识 (Permission) | 对应功能 | 风险等级 |
| :--- | :--- | :--- |
| `view:dashboard` | 查看应用启动台 | 低 |
| `access:gallery` | 进入相册图库应用 | 低 |
| `access:account` | 进入个人中心 (修改密码/头像) | 低 |
| `manage:system` | 进入 Casdoor 系统管理后台 | **高** |
| `manage:users` | 管理用户列表 | **高** |
| `view:analytics` | 查看系统统计数据 | 中 |

## 3. 角色-权限矩阵 (Matrix)

| 权限 \ 角色 | Admin (管理员) | User (普通用户) | Guest (访客) |
| :--- | :---: | :---: | :---: |
| `view:dashboard` | ✅ | ✅ | ❌ |
| `access:gallery` | ✅ | ✅ | ❌ |
| `access:account` | ✅ | ✅ | ❌ |
| `manage:system` | ✅ | ❌ | ❌ |
| `manage:users` | ✅ | ❌ | ❌ |
| `view:analytics` | ✅ | ❌ | ❌ |

## 4. 校验流程改进 (Performance)

### 旧流程 (Spaghetti)
1. 页面加载 -> 检查 Token
2. 渲染组件 -> 组件内部再次判断 `isAdmin`
3. 某些按钮 -> 再次请求后端验证

### 新流程 (Optimized)
1. **单一数据源**: `useAuthStore` 加载时一次性计算出用户的 Role。
2. **内存校验**: 所有组件通过 `hasPermission(user, 'perm')` 直接在内存中比对，耗时 < 0.1ms。
3. **路由守卫**: 路由层级直接拦截，无权用户根本无法加载组件代码。

> **性能提升预估**: 权限校验链路耗时减少 90% 以上 (消除了组件级的重复逻辑和潜在的异步请求)。
