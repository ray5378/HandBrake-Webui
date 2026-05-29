# 基于 jlesage/baseimage-gui 的 HandBrake Web UI Docker 镜像
# 支持 Intel QSV 硬件加速，只包含 CLI（非 GUI）

# 编译阶段 - 使用 Alpine
FROM alpine:3.20 AS builder

# 安装编译依赖
RUN apk add --no-cache \
    curl \
    binutils \
    git \
    clang17 \
    llvm17 \
    make \
    cmake \
    pkgconf \
    autoconf \
    automake \
    libtool \
    yasm \
    m4 \
    patch \
    coreutils \
    tar \
    file \
    python3 \
    nasm \
    meson \
    gettext-dev \
    glib-dev \
    musl-dev \
    gcc \
    g++ \
    linux-headers \
    jansson-dev \
    libxml2-dev \
    libpciaccess-dev \
    numactl-dev

# 定义版本
ARG HANDBRAKE_VERSION=1.8.0
ARG GMMLIB_VERSION=22.5.0
ARG INTEL_MEDIA_DRIVER_VERSION=24.2.5
ARG INTEL_MEDIA_SDK_VERSION=23.2.2
ARG INTEL_ONEVPL_VERSION=24.2.5

# 编译 gmmlib (Intel Media Driver 依赖)
RUN cd /tmp && \
    curl -sL "https://github.com/intel/gmmlib/archive/intel-gmmlib-${GMMLIB_VERSION}.tar.gz" | tar xz && \
    mkdir -p gmmlib/build && \
    cd gmmlib/build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr && \
    make -j$(nproc) && make install

# 编译 Intel Media Driver
RUN cd /tmp && \
    curl -sL "https://github.com/intel/media-driver/archive/intel-media-${INTEL_MEDIA_DRIVER_VERSION}.tar.gz" | tar xz && \
    mkdir -p media-driver/build && \
    cd media-driver/build && \
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr \
        -DCMAKE_INSTALL_LIBDIR=lib \
        -DBUILD_CMRTLIB=OFF \
        -DINSTALL_DRIVER_SYSCONF=OFF \
        -DMEDIA_RUN_TEST_SUITE=OFF && \
    make -j$(nproc) && make install

# 编译 Intel Media SDK (QSV)
RUN cd /tmp && \
    curl -sL "https://github.com/Intel-Media-SDK/MediaSDK/archive/intel-mediasdk-${INTEL_MEDIA_SDK_VERSION}.tar.gz" | tar xz && \
    mkdir -p MediaSDK/build && \
    cd MediaSDK/build && \
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr \
        -DENABLE_OPENCL=OFF \
        -DENABLE_WAYLAND=OFF \
        -DBUILD_DISPATCHER=ON && \
    make -j$(nproc) && make install

# 编译 oneVPL GPU Runtime (新代 QSV)
RUN cd /tmp && \
    curl -sL "https://github.com/oneapi-src/oneVPL-intel-gpu/archive/refs/tags/intel-onevpl-${INTEL_ONEVPL_VERSION}.tar.gz" | tar xz && \
    mkdir -p oneVPL-intel-gpu/build && \
    cd oneVPL-intel-gpu/build && \
    cmake .. \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr \
        -DCMAKE_INSTALL_LIBDIR=lib && \
    make -j$(nproc) && make install

# 编译 HandBrake CLI
RUN cd /tmp && \
    curl -sL "https://github.com/HandBrake/HandBrake/releases/download/${HANDBRAKE_VERSION}/HandBrake-${HANDBRAKE_VERSION}-source.tar.bz2" | tar xj && \
    cd HandBrake-${HANDBRAKE_VERSION} && \
    ./configure --prefix=/usr --build=build --enable-qsv --disable-gtk-gui && \
    make -j$(nproc) -C build && make -C build install

# 最终生产镜像
FROM jlesage/baseimage-gui:alpine-3.20-v4.11.3

WORKDIR /app

# 从编译阶段复制编译好的文件
COPY --from=builder /usr/lib/libmfx*.so* /usr/lib/
COPY --from=builder /usr/lib/libva* /usr/lib/
COPY --from=builder /usr/lib/dri/* /usr/lib/dri/
COPY --from=builder /usr/bin/HandBrakeCLI /usr/bin/
COPY --from=builder /usr/bin/ghb /usr/bin/
COPY --from=builder /usr/lib/libvpl.so* /usr/lib/

# 安装运行时依赖
RUN add-pkg \
    ffmpeg \
    libva \
    mesa-va-drivers \
    libdrm \
    libx264 \
    libx265 \
    libvpx \
    dav1d \
    dumb-init \
    && true

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
