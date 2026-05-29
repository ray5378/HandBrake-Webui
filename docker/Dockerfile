# 用于构建 AMD64 架构 Docker 镜像
# 基于 Debian，支持 Intel QSV 硬件加速

# 构建阶段
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  git \
  && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 安装后端依赖
WORKDIR /app/backend
RUN npm ci

# 安装前端依赖
WORKDIR /app/frontend
RUN npm ci

# 复制源代码
COPY backend /app/backend
COPY frontend /app/frontend

# 构建前端
WORKDIR /app/frontend
RUN npm run build

# 生产阶段
FROM node:20-bookworm-slim AS production

WORKDIR /app

# 启用 Debian unstable 仓库以获取 Intel QSV 库
RUN echo "deb http://deb.debian.org/debian unstable main non-free contrib" >> /etc/apt/sources.list

# 安装 HandBrake 和运行时依赖（含硬件加速支持）
RUN apt-get update && apt-get install -y --no-install-recommends \
  handbrake-cli \
  ffmpeg \
  tzdata \
  dumb-init \
  libva2 \
  libva-drm2 \
  libva-x11-2 \
  libva-intel-driver \
  intel-media-va-driver \
  mesa-va-drivers \
  mesa-vdpau-drivers \
  mesa-opencl-icd \
  libdrm2 \
  libdrm-intel1 \
  libx264-164 \
  libx265-199 \
  libvpx9 \
  libdav1d7 \
  libaom3 \
  # Intel QSV 硬件加速库
  intel-media-driver \
  libmfx-gen1.2 \
  && rm -rf /var/lib/apt/lists/*

# 设置时区
ENV TZ=Asia/Shanghai

# 复制构建产物
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/src ./backend/src
COPY --from=builder /app/backend/server.js ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

# 安装后端生产依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=52389
ENV UPLOAD_DIR=/source
ENV OUTPUT_DIR=/output
ENV CONFIG_DIR=/config

# 创建必要目录
RUN mkdir -p /config /source /output

# 暴露端口
EXPOSE 52389

# 使用 dumb-init 作为 PID 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# 启动命令
CMD ["node", "/app/backend/server.js"]

# 标签信息
LABEL maintainer="HandBrake Web UI Team"
LABEL description="HandBrake Web UI - Web-based video transcoding management with Intel QSV support"
LABEL org.opencontainers.image.source="https://github.com/your-username/handbrake-webui"
LABEL org.opencontainers.image.licenses="MIT"
