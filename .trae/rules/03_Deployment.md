# Account System V1.6 (Frozen) - Part 3: Deployment

### 2.1 自动化流水线 (Pipeline)

所有操作 **必须** 通过 `deploy_remote.ps1` 执行。

**命令**:
```powershell
.\deploy_remote.ps1 "Message"
```

**步骤**:
1.  **Local**: Git Commit & Push.
2.  **Remote**: SSH & Git Pull (Deploy Key).
3.  **Build**: Docker Compose Build.
4.  **Deploy**: Restart (`down` -> `up -d`).
5.  **Verify**: `/api/health` 验证 Version。

### 2.2 目录规范 (Remote)

```text
/home/ubuntu/account/
├── deploy/
│   └── correction/ (Source of Truth)
│       ├── docker-compose.yml
│       ├── Dockerfile.api
│       └── nginx.conf
├── server.js
```
