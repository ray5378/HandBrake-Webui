#!/bin/bash

# 代码规范检查脚本
# 使用方法: bash scripts/check-codestyle.sh

set -e

echo "========================================"
echo "  HandBrake Web UI 代码规范检查"
echo "========================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 未安装"
  exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
  echo "❌ npm 未安装"
  exit 1
fi

# 安装 ESLint 和 Prettier（如果需要）
echo "📦 检查代码检查工具..."
npm install --save-dev eslint prettier eslint-config-prettier 2>/dev/null || true

# 后端检查
echo ""
echo "🔍 检查后端代码..."
cd backend

if [ -f "package.json" ]; then
  npm install --silent 2>/dev/null || true

  if [ -f ".eslintrc.json" ]; then
    echo "  运行 ESLint..."
    npx eslint src/ --format stylish || true
  fi

  if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
    echo "  检查代码格式..."
    npx prettier --check src/ || {
      echo "  ⚠️  代码格式不符合规范，运行以下命令修复："
      echo "     npx prettier --write src/"
    }
  fi
fi

cd ..

# 前端检查
echo ""
echo "🔍 检查前端代码..."
cd frontend

if [ -f "package.json" ]; then
  npm install --silent 2>/dev/null || true

  if [ -f ".eslintrc.json" ]; then
    echo "  运行 ESLint..."
    npx eslint src/ --format stylish || true
  fi

  if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
    echo "  检查代码格式..."
    npx prettier --check src/ || {
      echo "  ⚠️  代码格式不符合规范，运行以下命令修复："
      echo "     npx prettier --write src/"
    }
  fi
fi

cd ..

echo ""
echo "========================================"
echo "  代码规范检查完成"
echo "========================================"
echo ""
echo "提示："
echo "  • 运行 'npm run lint' 进行完整检查"
echo "  • 运行 'npm run format' 自动修复格式问题"
