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

### 使用 Docker Compose 部署

```bash
# 克隆项目
git clone https://github.com/yourusername/handbrake-webui.git
cd handbrake-webui

# 创建必要目录
mkdir -p config source output

# 启动服务
docker-compose up -d

# 访问 Web UI
# http://localhost:3000
# 默认管理员账号: admin / changeme
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
