# HandBrake Web UI Docker 镜像
# 基于 jlesage/baseimage-gui，支持 Intel QSV 硬件加速

FROM jlesage/baseimage-gui:alpine-3.20-v4.11.3

WORKDIR /app

# jlesage/baseimage-gui 已包含:
# - HandBrake CLI
# - Intel VA-API / QSV 驱动
# - FFmpeg
# - 视频编解码库

# 安装 Node.js 运行时
RUN add-pkg nodejs npm && true

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
