#!/bin/bash
# ============================================================
# fpk 结构完整性验证脚本
# 在打包前检查所有必需文件是否存在、格式是否正确
# ============================================================

set -e

FPK_DIR="${1:-/workspace/fpk}"
ERRORS=0
WARNINGS=0

check_file() {
    local file="$1"
    local desc="$2"
    local optional="${3:-false}"

    if [ ! -f "${FPK_DIR}/${file}" ]; then
        if [ "$optional" = "true" ]; then
            echo "  WARN: ${file} — ${desc} (可选)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "  ERROR: ${file} — ${desc} (必需)"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo "  OK: ${file}"
    fi
}

check_executable() {
    local file="$1"
    if [ -f "${FPK_DIR}/${file}" ]; then
        if [ ! -x "${FPK_DIR}/${file}" ]; then
            echo "  WARN: ${file} — 缺少可执行权限"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

echo "========================================"
echo " fpk 结构完整性验证"
echo " 目录: ${FPK_DIR}"
echo "========================================"

echo ""
echo "--- 必需文件 ---"
check_file "manifest" "应用元数据"
check_file "ICON.PNG" "应用图标 (256x256)"
check_file "ICON_256.PNG" "高清图标"

echo ""
echo "--- UI 配置 ---"
check_file "app/ui/config" "UI 入口配置"
check_file "app/images/icon.png" "UI 图标" "true"

echo ""
echo "--- 生命周期脚本 ---"
check_file "cmd/main" "主生命周期脚本"
check_file "cmd/common" "公共函数库"
check_file "cmd/install_init" "安装前初始化"
check_file "cmd/install_callback" "安装后回调"
check_file "cmd/uninstall_init" "卸载前回调"
check_file "cmd/uninstall_callback" "卸载后回调"
check_file "cmd/upgrade_init" "升级前回调"
check_file "cmd/upgrade_callback" "升级后回调"
check_file "cmd/service" "Service 配置" "true"
check_file "cmd/config" "配置初始化" "true"

echo ""
echo "--- 权限配置 ---"
check_file "config/privilege" "权限配置" "true"
check_file "config/resource" "资源配置" "true"

echo ""
echo "--- 可执行权限检查 ---"
check_executable "cmd/main"
check_executable "cmd/common"
check_executable "cmd/install_init"
check_executable "cmd/install_callback"
check_executable "cmd/uninstall_init"
check_executable "cmd/uninstall_callback"
check_executable "cmd/upgrade_init"
check_executable "cmd/upgrade_callback"

echo ""
echo "--- Manifest 字段检查 ---"
if [ -f "${FPK_DIR}/manifest" ]; then
    REQUIRED_FIELDS=("appname" "version" "display_name" "platform" "source" "os_min_version" "service_port")
    for field in "${REQUIRED_FIELDS[@]}"; do
        if grep -qs "^${field}[[:space:]]*=" "${FPK_DIR}/manifest"; then
            value=$(grep "^${field}[[:space:]]*=" "${FPK_DIR}/manifest" | head -1 | cut -d= -f2- | xargs)
            echo "  OK: ${field} = ${value}"
        else
            echo "  ERROR: manifest 缺少字段 '${field}'"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

echo ""
echo "========================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo " 结果: 全部通过"
elif [ $ERRORS -eq 0 ]; then
    echo " 结果: 通过（${WARNINGS} 个警告）"
    echo " 建议: 检查警告项，确认是否符合预期"
else
    echo " 结果: 失败（${ERRORS} 个错误，${WARNINGS} 个警告）"
    echo " 请修复上述错误后重新验证"
    exit 1
fi
echo "========================================"