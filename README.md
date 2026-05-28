# HandBrake Web UI
基于 HandBrake 的 Web 视频转码管理界面

## 特性

- 🌐 响应式 Web UI - 支持桌面端和移动端
- 🔐 JWT 认证系统 - 支持多用户管理
- 🎬 视频转码 - 支持多种编码格式
- 📊 实时进度 - 实时监控转码进度
- 🐳 Docker 部署 - 一键部署,开箱即用
- 📁 文件管理 - 直观的文件浏览器
- ⚡ 硬件加速 - 支持 Intel/AMD/NVIDIA 硬件转码

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
      - "52389:52389"  # 宿主机:内部端口，可以自行修改宿主机端口
    volumes:
      - ./config:/config
      - ./source:/source
      - ./output:/output
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - PORT=52389
      - MAX_CONCURRENT_JOBS=2
    devices:
      - /dev/dri:/dev/dri  # Intel/AMD 硬件转码支持
    # NVIDIA 硬件加速支持 (需先配置 nvidia-docker2 运行时)
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]
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
- 默认地址: http://localhost:52389
- 修改端口: 可以在 `docker-compose.yml` 中修改 `ports` 配置，例如改成 `8080:52389`
- 自定义内部端口: 可以在 `environment` 中设置 `PORT=你的端口`
- 首次访问: 请在页面上设置管理员账号密码

---

### 使用 Docker 直接部署

```bash
# 拉取镜像
docker pull ray5378/handbrake-webui:latest

# 启动容器
docker run -d \
  --name handbrake-webui \
  -p 52389:52389 \
  -v $(pwd)/config:/config \
  -v $(pwd)/source:/source \
  -v $(pwd)/output:/output \
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production \
  -e PORT=52389 \
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
| JWT_SECRET | JWT 密钥 | (随机生成) |
| PORT | 服务端口 | 52389 |
| MAX_CONCURRENT_JOBS | 最大并发转码数 | 2 |

### 目录映射

- `/source`: 源视频文件目录
- `/output`: 转码输出目录
- `/config`: 数据库和配置目录

### 硬件加速配置

#### Intel/AMD GPU (VA-API/QSV)
默认已启用，通过 `/dev/dri` 设备映射提供支持。

#### NVIDIA GPU (NVENC)
需要先在主机上安装 `nvidia-docker2` 运行时，然后在 `docker-compose.yml` 中取消注释 NVIDIA 配置。

安装 nvidia-docker2 的步骤：
```bash
# 详细步骤请参考 NVIDIA 官方文档
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

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
