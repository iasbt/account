# 测试策略与自动化实施手册 (Test Strategy & Automation Manual)

> **评估对象**: Account System V1.6
> **版本**: V1.0
> **状态**: ⚪ **Manual** (For Review)

## 1. 测试现状 (Current State)

| 维度 | 现状 (0-10) | 评级 | 简评 |
| :--- | :--- | :--- | :--- |
| **Unit Test** | 1.0 | 🔴 Poor | 仅存在 `src/lib/rbac.test.ts` (前端 RBAC 测试)。后端几乎为零。 |
| **Integration** | 2.0 | 🟠 Poor | 仅存在简单的 `k6` 负载测试脚本。无 API 自动化测试。 |
| **E2E Test** | 0.0 | 🔴 None | 无端到端测试。 |
| **Coverage** | < 5% | 🔴 Low | 极低。 |

## 2. 自动化建设目标 (Automation Goals)

### 2.1 目标：Phase 3 准备 (Test Readiness)

| 层级 | 工具选型 | 目标覆盖率 | 核心场景 |
| :--- | :--- | :--- | :--- |
| **Unit Test** | **Vitest** | > 60% | 后端 Services (Auth, User), 前端 Utilities. |
| **Integration** | **Supertest** | > 80% | 后端 API Routes (Auth Register/Login/Me). |
| **E2E Test** | **Playwright** | 关键流程 | 用户注册 -> 登录 -> 查看 Dashboard -> 退出. |
| **Load Test** | **k6** | 基线 | P99 < 500ms (100 VU). |

## 3. 实施计划 (Implementation Plan)

### 3.1 基础设施搭建 (Infrastructure Setup)

1.  **Backend**:
    *   安装 `vitest`, `supertest`.
    *   配置 `test/setup.ts` (Mock Database).
2.  **Frontend**:
    *   安装 `@testing-library/react`, `vitest`, `jsdom`.
    *   配置 `vitest.config.ts`.
3.  **CI/CD**:
    *   配置 GitHub Actions Workflow (`.github/workflows/test.yml`).
    *   每次 Push 触发 Unit Tests。

### 3.2 测试用例清单 (Test Cases)

#### 后端 (Backend API)
*   **Auth**:
    *   `POST /api/auth/register`: 成功注册、重复邮箱、验证码错误。
    *   `POST /api/auth/login`: 成功登录、密码错误、用户不存在。
    *   `GET /api/auth/me`: 成功获取信息、未登录 401。
*   **Health**:
    *   `GET /api/health`: 返回 `status: ok` 和正确版本号。

#### 前端 (Frontend Components)
*   **Login Page**:
    *   输入框正常渲染。
    *   点击登录按钮触发 API 调用。
    *   错误提示正常显示。
*   **Register Page**:
    *   表单验证（必填项、邮箱格式）。

## 4. 脚本模板 (Code Snippets)

### 4.1 Backend Integration Test (Supertest)

```typescript
import request from 'supertest';
import app from '../app'; // 需从 server.js 导出 app

describe('Auth API', () => {
  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('参数不完整');
  });
});
```

### 4.2 Frontend Component Test (React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
});
```

## 5. 结论

**立即行动**:
1.  **Backend**: 安装 `supertest` 并编写第一个 API 测试（Health Check）。
2.  **Frontend**: 安装 `vitest` 并编写第一个组件测试（Login Page）。
3.  **CI**: 配置 GitHub Actions。

只有建立了基本的测试防护网，才能放心地进行 Phase 3 的大规模开发。
