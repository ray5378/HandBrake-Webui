# Docker 自动构建说明

## 📋 功能说明

项目已配置 Docker 自动构建和发布流程：

### 1. 自动触发构建

- **主分支推送** (`main`/`develop`)
  - 自动构建并推送最新镜像
  - 标签：`latest`, `main`/`develop`

- **Tag 发布** (`v*`)
  - 自动构建并推送版本镜像
  - 标签：`v1.0.0`, `1.0`, `1`, `latest`

- **Pull Request**
  - 仅构建镜像，不推送
  - 测试容器启动是否正常

- **多平台支持**
  - `linux/amd64` (x86_64)
  - `linux/arm64` (ARM64, Apple Silicon)

### 2. 缓存优化

使用 GitHub Actions Cache 优化构建速度：
- 层缓存复用
- 减少构建时间
- 提高发布效率

---

## 🔧 设置步骤

### 1. 配置 Docker Hub 密钥

在 GitHub 仓库设置中添加以下 Secrets：

| 密钥名称 | 说明 |
|---------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub 访问令牌（推荐）或密码 |

#### 获取 Docker Hub Token：

1. 访问 https://hub.docker.com/settings/security
2. 点击 "New Access Token"
3. 输入描述（如 "GitHub Actions"）
4. 复制生成的 Token

### 2. 配置镜像名称（可选）

修改 `.github/workflows/docker-build.yml` 中的镜像名称：

```yaml
images: |
  your-username/handbrake-webui
```

---

## 🚀 使用流程

### 开发阶段

```bash
# 开发代码
git checkout -b feature/my-feature

# 提交改动
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 创建 PR
# GitHub Actions 会自动构建测试镜像
```

### 发布版本

```bash
# 更新代码到 main 分支
git checkout main
git merge feature/my-feature

# 创建并推送 Tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions 会：
# 1. 构建并推送多架构镜像
# 2. 自动创建 GitHub Release
# 3. 发布 docker-compose.yml 和 .env.example
```

---

## 🐳 使用发布的镜像

### Docker Compose

```yaml
version: '3.8'

services:
  handbrake-webui:
    image: your-username/handbrake-webui:latest
    container_name: handbrake-webui
    ports:
      - "3000:3000"
    volumes:
      - ./config:/config
      - ./source:/source
      - ./output:/output
      - ./cache:/cache
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=changeme123
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - MAX_CONCURRENT_JOBS=2
    restart: unless-stopped
```

### Docker 命令

```bash
# 拉取最新镜像
docker pull your-username/handbrake-webui:latest

# 运行容器
docker run -d \
  --name handbrake-webui \
  -p 3000:3000 \
  -v $(pwd)/config:/config \
  -v $(pwd)/source:/source \
  -v $(pwd)/output:/output \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme123 \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  --restart unless-stopped \
  your-username/handbrake-webui:latest
```

---

## 🔄 手动构建（本地开发）

### 构建本地镜像

```bash
# 构建镜像
docker build -f docker/Dockerfile -t handbrake-webui:local .

# 运行测试
docker run -d -p 3000:3000 handbrake-webui:local
```

### 使用自定义标签

```bash
# 多平台构建（需要 buildx）
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f docker/Dockerfile \
  -t handbrake-webui:local \
  --load .
```

---

## 📊 版本标签说明

| 标签类型 | 示例 | 说明 |
|---------|------|------|
| `latest` | `latest` | 最新稳定版本 |
| `v*` | `v1.0.0` | 具体版本号 |
| `major.minor` | `1.0` | 大版本.小版本 |
| `major` | `1` | 大版本 |
| `sha` | `sha-abc123def` | Git SHA 完整值 |
| `branch` | `main`, `develop` | 分支名 |

---

## 🛠️ 故障排查

### 构建失败

```bash
# 查看 GitHub Actions 日志
# GitHub 仓库 -> Actions -> 选择工作流 -> 查看详细日志
```

### 推送失败

1. 检查 Docker Hub Secrets 是否配置正确
2. 确认 Token 有 `write:packages` 权限
3. 检查仓库是否为公开或 Token 有权限访问

---

## 🔐 安全建议

1. **使用 Token 而非密码** - 更安全，可随时撤销
2. **限制 Token 权限** - 仅给予必要的读写权限
3. **定期轮换 Token** - 建议每 3-6 个月更新一次
4. **不提交敏感信息** - `.env` 文件应在 `.gitignore` 中
5. **使用私有仓库** - 如需要，可使用 Docker Hub 私有仓库或 GitHub Container Registry

---

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Buildx 文档](https://docs.docker.com/buildx/working-with-buildx/)
