# HandBrake Web UI - Docker 快速开始

## 🚀 一键部署

```bash
# 1. 创建挂载目录
mkdir -p config drive
chmod 777 config drive

# 2. 复制环境变量配置
cp .env.example .env
# 编辑 .env，修改密码和密钥！

# 3. 启动服务
docker-compose up -d

# 4. 访问
# http://localhost:52389
# 默认管理员: admin / changeme123
```

---

## 📋 详细说明

### 使用已发布的镜像

```bash
# 拉取镜像
docker pull your-username/handbrake-webui:latest

# 运行容器
docker run -d \
  --name handbrake-webui \
  -p 52389:52389 \
  -v $(pwd)/config:/config \
  -v $(pwd)/drive:/drive \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  --restart unless-stopped \
  your-username/handbrake-webui:latest
```

### 本地构建镜像

```bash
# 方式一：使用 npm 脚本
npm run docker:buildx

# 方式二：使用 docker 命令
docker build -f docker/Dockerfile -t handbrake-webui:local .
```

### 测试本地镜像

```bash
# 启动测试容器
npm run docker:test

# 或手动运行
docker run -d -p 52389:52389 --name handbrake-test handbrake-webui:local

# 访问测试
# http://localhost:52389

# 停止并删除
docker stop handbrake-test && docker rm handbrake-test
```

---

## 🔧 配置说明

### 环境变量

在 `.env` 文件中配置：

```bash
# 服务配置
NODE_ENV=production

# JWT 密钥（生产环境必须修改！）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 日志级别: ERROR, WARN, INFO, DEBUG
LOG_LEVEL=INFO
```

### 目录映射

| 宿主机 | 容器 | 说明 |
|-------|------|------|
| `./config` | `/config` | 数据库和配置 |
| `./drive` | `/drive` | 源视频、转码输出、缓存等所有文件 |

所有文件操作都在 `/drive` 同一文件系统内，避免跨设备移动文件导致的错误。

### 首次使用配置

1. 访问 Web UI，设置管理员账号
2. 进入 **设置 → 缓存目录**，通过文件浏览器选择一个临时缓存目录（如 `/drive/cache`）
3. 返回文件管理页面，即可开始选择源文件进行转码

---

## 🛠️ 常用命令

### 开发阶段

```bash
# 创建必要目录
mkdir -p config drive
chmod 777 config drive

# 代码检查
npm run lint

# 代码格式化
npm run format

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 发布版本

```bash
# 1. 创建并推送 Tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. 等待 GitHub Actions 自动构建
# 访问: https://github.com/your-username/handbrake-webui/actions

# 3. 查看 Release
# https://github.com/your-username/handbrake-webui/releases
```

### 容器管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 查看状态
docker-compose ps

# 更新镜像并重启
docker-compose pull
docker-compose up -d
```

---

## 🔐 安全注意事项

### 1. 修改默认密码

**重要！** 首次部署后请立即修改默认密码！

### 2. 使用强 JWT 密钥

```bash
# 生成强密钥
openssl rand -base64 64
```

### 3. 限制访问

使用反向代理（如 Nginx、Traefik）并配置：
- HTTPS 证书
- 访问 IP 白名单
- HTTP 身份认证

### 4. 备份数据库

```bash
# 备份配置目录
cp -r config config.backup.$(date +%Y%m%d)
```

---

## 📊 故障排查

### 容器无法启动

```bash
# 查看日志
docker-compose logs -f

# 检查端口占用
lsof -i :52389
netstat -tulpn | grep 52389
```

### 文件权限问题

```bash
# 修复权限
chmod 777 -R config drive
```

### 数据库问题

```bash
# 删除数据库重新初始化（会丢失所有数据！）
rm -f config/database.sqlite
docker-compose restart
```

### 转码任务提交失败

如果提示"请先在设置中配置缓存目录"，请按以下步骤操作：
1. 访问 Web UI
2. 进入 **设置 → 缓存目录**
3. 通过文件浏览器选择一个目录（例如 `/drive/cache`）
4. 点击保存

### 性能优化

```bash
# 1. 限制 CPU/内存
# 在 docker-compose.yml 中添加
#   deploy:
#     resources:
#       limits:
#         cpus: '2.0'
#         memory: 4G

# 2. 使用 SSD 存储 drive 目录
```

---

## 📝 更新日志

### v1.0.0 (2026-05-28)

- ✅ 初始发布
- ✅ JWT 认证系统
- ✅ 文件管理功能
- ✅ 视频转码功能
- ✅ 任务队列管理
- ✅ 响应式 UI（桌面端 + 移动端）
- ✅ Docker 自动构建
- ✅ 多平台支持 (AMD64/ARM64)
- ✅ 单挂载点设计，解决跨设备文件移动问题

---

## 💡 提示

1. **使用单个挂载点** - 所有文件操作集中在 `/drive`，避免跨文件系统错误
2. **首次先配缓存** - 使用前先在设置中配置缓存目录
3. **定期备份** - 重要配置和数据库
4. **监控资源使用** - 转码会消耗大量 CPU/内存
5. **使用 SSD** - 提升 IO 性能和转码速度

---

## 📚 更多资源

- [项目文档](./PROJECT_SUMMARY.md)
- [Docker 自动构建说明](./DOCKER_BUILD_README.md)
- [技术架构文档](./.trae/documents/architecture-handbrake-webui.md)
- [代码规范](./.github/CODE_STYLE_CHECKLIST.md)

---

## 📞 获取帮助

遇到问题请：
1. 查看日志
2. 检查文档
3. 提交 Issue
