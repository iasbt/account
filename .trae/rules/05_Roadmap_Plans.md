# Account System V1.6 (Frozen) - Part 5: Plans

### 4. 下一步计划 (Next Steps)

1.  **相册 (Gallery)**: Cloudflare R2 存储。
2.  **SSO 联调**:
    *   **Gallery** (免登)
    *   **Toolbox**
    *   **Life OS**

> **架构红线**: 任何新功能不得破坏 `deploy/correction` 基础设施。

### 5. 协作规范 (Red Lines)

> **严正声明**: 违反必究。

#### 5.1 路径绝对化
*   ❌ `cd deploy/correction`
*   ✅ `cd /home/ubuntu/account/deploy/correction/`

#### 5.2 部署原子化
**Git Flow**: Local (Commit/Push) -> Remote (Pull/Rebuild).
🚫 **禁止**: 跳过 GitHub 直接修改服务器。
