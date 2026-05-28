# HandBrake Web UI
基于 HandBrake 的 Web 视频转码管理界面

## 特性

- 🌐 响应式 Web UI - 支持桌面端和移动端
- 🔐 JWT 认证系统 - 支持多用户管理
- 🎬 视频转码 - 支持多种编码格式
- 📊 实时进度 - 实时监控转码进度
- 🐳 Docker 部署 - 一键部署,开箱即用
- 📁 文件管理 - 直观的文件浏览器

## 快速开始

### 使用 Docker Compose 部署 (推荐)

#### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  handbrake-webui:
    image: ray5378/handbrake-webui:latest
    container_name: handbrake-webui
    ports:
      - "3000:3000"  # 宿主机:内部端口，可以自行修改宿主机端口
    volumes:
      - ./config:/config
      - ./source:/source
      - ./output:/output
    environment:
      - NODE_ENV=production
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=changeme123
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - PORT=3000
      - MAX_CONCURRENT_JOBS=2
    restart: unless-stopped
    networks:
      - handbrake-network

networks:
  handbrake-network:
    driver: bridge
```

#### 2. 启动服务

```bash
# 创建必要目录
mkdir -p config source output

# 启动容器
docker-compose up -d

# 查看实际使用的端口
docker ps

# 查看日志
docker-compose logs -f
```

#### 3. 访问 Web UI
- 默认地址: http://localhost:3000
- 修改端口: 可以在 `docker-compose.yml` 中修改 `ports` 配置，例如改成 `8080:3000`
- 自定义内部端口: 可以在 `environment` 中设置 `PORT=你的端口`
- 默认账号: `admin` / `changeme123` (请务必修改密码!)

---

### 使用 Docker 直接部署

```bash
# 拉取镜像
docker pull ray5378/handbrake-webui:latest

# 启动容器
docker run -d \
  --name handbrake-webui \
  -p 3000:3000 \
  -v $(pwd)/config:/config \
  -v $(pwd)/source:/source \
  -v $(pwd)/output:/output \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=changeme123 \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  -e PORT=3000 \
  -e MAX_CONCURRENT_JOBS=2 \
  --restart unless-stopped \
  ray5378/handbrake-webui:latest
```

---

### 本地构建

如果您想自己构建镜像：

```bash
# 克隆项目
git clone https://github.com/ray5378/handbrake-webui.git
cd handbrake-webui

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 手动部署

```bash
# 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 启动后端
cd backend && npm start

# 启动前端开发服务器
cd frontend && npm run dev
```

## 目录结构

```
handbrake-webui/
├── docker/              # Docker 配置
├── backend/             # 后端代码
├── frontend/            # 前端代码
├── source/              # 源视频目录 (映射)
├── output/              # 输出目录 (映射)
├── config/              # 配置目录 (映射)
└── docker-compose.yml   # Docker Compose 配置
```

## 配置说明

### 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| ADMIN_USERNAME | 管理员用户名 | admin |
| ADMIN_PASSWORD | 管理员密码 | changeme |
| JWT_SECRET | JWT 密钥 | (随机生成) |
| PORT | 服务端口 | 3000 |
| MAX_CONCURRENT_JOBS | 最大并发转码数 | 2 |

### 目录映射

- `/source`: 源视频文件目录
- `/output`: 转码输出目录
- `/config`: 数据库和配置目录

## 支持的格式

### 输入格式
- MP4, MKV, AVI, MOV, WMV, FLV, WebM 等

### 输出格式
- MP4 (H.264, H.265)
- MKV (H.264, H.265, VP9, AV1)
- WebM (VP9, AV1)

## API 文档

启动服务后访问 `http://localhost:3000/api/docs` 查看完整 API 文档。

## 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: Node.js + Express
- **数据库**: SQLite
- **转码**: HandBrake CLI
- **容器化**: Docker + Docker Compose

## 许可证

MIT License
