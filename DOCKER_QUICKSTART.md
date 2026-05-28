# HandBrake Web UI - Docker 快速开始

## 🚀 一键部署

```bash
# 1. 创建挂载目录
mkdir -p config source output
chmod 777 config source output

# 2. 复制环境变量配置
cp .env.example .env
# 编辑 .env，修改密码和密钥！

# 3. 启动服务
docker-compose up -d

# 4. 访问
# http://localhost:3000
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

### 本地构建镜像

```bash
# 方式一：使用 npm 脚本
npm run docker:buildx

# 方式二：使用 docker 命令
docker build -f docker/Dockerfile -t handbrake-webui:local .

# 方式三：多平台构建
npm run docker:buildx-multi
```

### 测试本地镜像

```bash
# 启动测试容器
npm run docker:test

# 或手动运行
docker run -d -p 3000:3000 --name handbrake-test handbrake-webui:local

# 访问测试
# http://localhost:3000

# 停止并删除
docker stop handbrake-test && docker rm handbrake-test
```

---

## 🔧 配置说明

### 环境变量

在 `.env` 文件中配置：

```bash
# 服务配置
PORT=3000
NODE_ENV=production

# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123  # 请修改！

# JWT 密钥（生产环境必须修改！）
# 使用以下命令生成: openssl rand -base64 64
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 转码配置
MAX_CONCURRENT_JOBS=2

# 日志级别: ERROR, WARN, INFO, DEBUG
LOG_LEVEL=INFO
```

### 目录映射

| 宿主机 | 容器 | 说明 |
|-------|------|------|
| `./config` | `/config` | 数据库和配置 |
| `./source` | `/source` | 源视频文件 |
| `./output` | `/output` | 转码输出文件 |

---

## 🛠️ 常用命令

### 开发阶段

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 构建本地镜像
npm run docker:buildx

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
lsof -i :3000
netstat -tulpn | grep 3000
```

### 文件权限问题

```bash
# 修复权限
chmod 777 -R config source output
```

### 数据库问题

```bash
# 删除数据库重新初始化（会丢失所有数据！）
rm -f config/database.sqlite
docker-compose restart
```

### 性能优化

```bash
# 1. 限制 CPU/内存
# 在 docker-compose.yml 中添加
#   deploy:
#     resources:
#       limits:
#         cpus: '2.0'
#         memory: 4G

# 2. 使用 SSD 存储 source 和 output 目录
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

---

## 🔗 更多资源

- [项目文档](./PROJECT_SUMMARY.md)
- [Docker 自动构建说明](./DOCKER_BUILD_README.md)
- [技术架构文档](./.trae/documents/architecture-handbrake-webui.md)
- [代码规范](./.github/CODE_STYLE_CHECKLIST.md)

---

## 💡 提示

1. **建议使用 Docker Compose** - 更方便配置和管理
2. **定期备份** - 重要配置和数据库
3. **监控资源使用** - 转码会消耗大量 CPU/内存
4. **使用 SSD** - 提升 IO 性能和转码速度
5. **更新镜像** - 安全更新和新功能

---

## 📞 获取帮助

遇到问题请：
1. 查看日志
2. 检查文档
3. 提交 Issue
