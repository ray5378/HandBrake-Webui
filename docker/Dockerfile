# HandBrake Web UI Docker 镜像
# 基于 debian:bookworm-slim，支持 Intel QSV、AMD VCN 和 NVIDIA NVENC 硬件加速

FROM debian:bookworm-slim

# 设置非交互式环境变量，避免 apt-get 要求输入
ENV DEBIAN_FRONTEND=noninteractive

# 添加 Debian non-free 仓库以获取 Intel 非免费驱动
RUN echo "deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb-src http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb-src http://deb.debian.org/debian-security/ bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb-src http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# 安装基础依赖和硬件驱动
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Intel QSV 驱动链
    libva2 libva-drm2 libva-x11-2 \
    intel-media-va-driver-non-free \
    # AMD VCN 驱动
    mesa-va-drivers \
    # HandBrake CLI
    handbrake-cli \
    # 常用工具
    ffmpeg pciutils curl ca-certificates dumb-init \
    # 构建 Node.js 和 better-sqlite3 依赖
    python3 make g++ gcc git \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 Node.js 应用
COPY backend/package*.json ./backend/
COPY backend/src ./backend/src
COPY backend/server.js ./backend/
COPY frontend/dist ./frontend/dist

# 安装 Node.js 依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=52389
ENV UPLOAD_DIR=/source
ENV OUTPUT_DIR=/output
ENV CONFIG_DIR=/config

# 创建目录
RUN mkdir -p /config /source /output

# 暴露端口
EXPOSE 52389

# 使用 dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "/app/backend/server.js"]

# 标签信息
LABEL maintainer="HandBrake Web UI Team"
LABEL description="HandBrake Web UI - Web-based video transcoding management"
LABEL org.opencontainers.image.source="https://github.com/ray5378/HandBrake-Webui"
LABEL org.opencontainers.image.licenses="MIT"
