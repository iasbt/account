# Windows PowerShell Rules (Win 兼容规范)

> **Status**: Active | **Priority**: P0 | **Strict**

## 1. 禁止 &&
*   **规则**: 终端命令严禁使用 `&&`。
*   **原因**: PowerShell 5.x 不支持，会导致解析错误。
*   **方案**: 使用分号 `;` (如 `git add . ; git push`) 或分步执行。

## 2. 路径规范
*   **规则**: Windows 终端操作优先使用反斜杠 `\`。
*   **代码**: 脚本中应使用 `path.join` 避免硬编码。

## 3. 环境变量
*   **禁止**: `export` 或 `SET`。
*   **正确**: PowerShell 用 `$env:VAR='val'`。
*   **跨平台**: `package.json` 必须用 `cross-env`。

## 4. 脚本执行
*   **规则**: `.ps1` 脚本必须带 `.\` 前缀 (如 `.\deploy.ps1`)。
*   **策略**: 确保执行策略为 `RemoteSigned`。

## 5. curl 使用
*   **规则**: 在 PowerShell 中执行 HTTP 检测时，禁止直接使用 `curl`。
*   **原因**: `curl` 在 PowerShell 中是 `Invoke-WebRequest` 的别名。
*   **方案**: 必须使用 `curl.exe`，或显式使用 `Invoke-WebRequest`。
