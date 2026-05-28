#!/bin/bash

# 代码格式自动修复脚本
# 使用方法: bash scripts/format-code.sh

set -e

echo "========================================"
echo "  HandBrake Web UI 代码格式化"
echo "========================================"
echo ""

# 后端格式化
echo "🔧 格式化后端代码..."
cd backend

if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
  npx prettier --write src/
  echo "  ✅ 后端代码格式化完成"
else
  echo "  ⚠️  未找到 Prettier 配置"
fi

cd ..

# 前端格式化
echo ""
echo "🔧 格式化前端代码..."
cd frontend

if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ]; then
  npx prettier --write src/
  echo "  ✅ 前端代码格式化完成"
else
  echo "  ⚠️  未找到 Prettier 配置"
fi

cd ..

echo ""
echo "========================================"
echo "  代码格式化完成"
echo "========================================"
