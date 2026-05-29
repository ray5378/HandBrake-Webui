#!/bin/bash

# Docker 部署脚本
# 使用方法: bash scripts/deploy.sh

set -e

echo "========================================"
echo "  HandBrake Web UI 部署"
echo "========================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 未安装"
  exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose 未安装"
  exit 1
fi

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p config drive

# 设置目录权限
echo "🔐 设置目录权限..."
chmod 777 config drive

# 复制环境变量文件
if [ ! -f ".env" ]; then
  echo "📝 创建环境变量文件..."
  cp .env.example .env
  echo "  ⚠️  请修改 .env 文件中的密码和密钥"
fi

# 构建 Docker 镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

echo ""
echo "========================================"
echo "  部署完成!"
echo "========================================"
echo ""
echo "访问地址: http://localhost:3000"
echo "默认管理员: admin / changeme123"
echo ""
echo "常用命令:"
echo "  • 查看日志: docker-compose logs -f"
echo "  • 停止服务: docker-compose down"
echo "  • 重启服务: docker-compose restart"
