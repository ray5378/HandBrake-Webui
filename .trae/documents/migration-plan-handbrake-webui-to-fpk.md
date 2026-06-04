# HandBrake-Webui 迁移至 fnOS fpk 原生应用 — 迁移计划文档

> 版本: v1.0 | 日期: 2026-06-04 | 状态: 草稿

---

## 目录

1. [业务需求与用户故事](#1-业务需求与用户故事)
2. [功能与非功能需求](#2-功能与非功能需求)
3. [验收标准](#3-验收标准)
4. [技术设计文档](#4-技术设计文档)
5. [系统架构图](#5-系统架构图)
6. [模块与接口设计](#6-模块与接口设计)
7. [技术选型与关键决策](#7-技术选型与关键决策)
8. [任务拆解清单 (WBS)](#8-任务拆解清单-wbs)
9. [开发任务卡](#9-开发任务卡)
10. [测试计划](#10-测试计划)
11. [部署手册](#11-部署手册)
12. [用户手册](#12-用户手册)
13. [常见问题 FAQ](#13-常见问题-faq)
14. [验收报告](#14-验收报告)
15. [总结复盘](#15-总结复盘)

---

## 1. 业务需求与用户故事

### 1.1 业务背景

HandBrake-Webui 是一个基于 Web 界面的视频转码管理工具，底层调用 HandBrake CLI 实现视频转码。当前项目以 Docker 容器方式部署。为更好地集成到飞牛 fnOS 生态，需要将其包装为标准 fpk 应用，使其能出现在 fnOS 桌面，支持 FN Connect 远程访问，并提供原生应用管理体验。

### 1.2 用户故事

| ID | 角色 | 用户故事 | 优先级 |
|---|---|---|---|
| US-01 | fnOS 用户 | 作为 fnOS 用户，我希望能从应用中心一键安装 HandBrake-Webui，无需手动配置 Docker | P0 |
| US-02 | fnOS 用户 | 安装后桌面自动生成图标，点击即可打开 Web UI | P0 |
| US-03 | fnOS 用户 | 我希望能通过 FN Connect 远程访问 HandBrake-Webui | P0 |
| US-04 | fnOS 用户 | 我希望转码任务能利用 Intel QSV / VA-API 硬件加速 | P0 |
| US-05 | fnOS 用户 | 我希望配置和数据在应用升级后不丢失 | P0 |
| US-06 | fnOS 管理员 | 我希望能管理用户账号和转码队列 | P1 |
| US-07 | fnOS 用户 | 我希望能通过手机浏览器访问并使用 HandBrake-Webui | P1 |
| US-08 | fnOS 用户 | 我希望应用能随系统开机自启 | P1 |

### 1.3 核心业务流程

```
用户登录 → 查看文件列表 → 选择视频文件 → 选择转码预设
  → 提交转码任务 → 后台 HandBrake CLI 执行 → 查看任务进度
  → 下载/预览转码完成文件
```

---

## 2. 功能与非功能需求

### 2.1 功能需求

| ID | 需求描述 | 关联用户故事 | 优先级 |
|---|---|---|---|
| FR-01 | 应用安装后桌面显示图标，点击以 iframe 形式打开 Web UI | US-02 | P0 |
| FR-02 | Web UI 保留原有全部功能：文件管理、转码、预设管理、任务队列、用户管理 | US-01 | P0 |
| FR-03 | 转码任务调用 HandBrake CLI + FFmpeg，支持 Intel QSV / VA-API 硬件加速 | US-04 | P0 |
| FR-04 | 映射 `/config` 目录持久化配置、数据库、JWT 密钥 | US-05 | P0 |
| FR-05 | 映射 `/drive` 目录让用户管理待转码视频文件 | US-05 | P0 |
| FR-06 | 支持 fnOS 桌面 iframe 集成，URL 路径兼容 | US-03 | P0 |
| FR-07 | 应用停止/启动/升级生命周期管理 | US-08 | P1 |

### 2.2 非功能需求

| ID | 需求描述 | 指标 | 优先级 |
|---|---|---|---|
| NFR-01 | 性能 - 转码性能与 Docker 部署持平 | 同等 CPU/GPU 利用率 | P0 |
| NFR-02 | 兼容性 - 支持 x86_64 架构（fnOS 主流平台） | Intel/AMD CPU | P0 |
| NFR-03 | 安全性 - 仅监听内部端口，不对外暴露危险端口 | 端口不映射到宿主机 | P0 |
| NFR-04 | 可维护性 - 应用升级保留配置和数据 | 升级后配置不丢失 | P0 |
| NFR-05 | 可用性 - 应用崩溃后自动重启 | restart policy | P1 |

---

## 3. 验收标准

### 3.1 安装验收

- [ ] AC-01: 在 fnOS 应用中心通过 `fpk` 文件成功安装
- [ ] AC-02: 安装完成后桌面生成 HandBrake-Webui 图标
- [ ] AC-03: 点击图标以 iframe 形式打开 Web UI
- [ ] AC-04: 通过 FN Connect 可远程访问应用

### 3.2 功能验收

- [ ] AC-05: 用户登录/注册/管理功能正常
- [ ] AC-06: 文件浏览、上传、删除功能正常
- [ ] AC-07: 视频转码任务提交、进度查看、取消功能正常
- [ ] AC-08: 预设管理（新增/编辑/删除）功能正常
- [ ] AC-09: Intel QSV / VA-API 硬件加速可正常启用
- [ ] AC-10: 缩略图生成正常

### 3.3 运维验收

- [ ] AC-11: 应用停止后 Web UI 不可访问
- [ ] AC-12: 应用启动后自动恢复服务
- [ ] AC-13: 应用卸载后数据卷可选择性清理
- [ ] AC-14: 应用升级后配置和数据保留

---

## 4. 技术设计文档

### 4.1 迁移方案选型

经过对 fnOS fpk 应用格式的调研，存在两种可行的包装方式：

| 方案 | 描述 | 复杂度 | 推荐 |
|---|---|---|---|
| **方案 A: Docker-based fpk** | 将现有 Docker 镜像包装为 fpk，通过 Docker 运行时启动容器 | ⭐⭐ | **推荐** |
| **方案 B: Native fpk** | 直接运行 Node.js 进程，不依赖 Docker | ⭐⭐⭐⭐⭐ | 不推荐 |

**推荐方案 A (Docker-based fpk)** 理由：
1. HandBrake-Webui 已有完善的 Dockerfile（多阶段构建、依赖管理）
2. fnOS 原生支持 Docker 运行时
3. fpk 对 Docker 应用有成熟的包装模板
4. 硬件加速设备（`/dev/dri`）在容器内可直接透传
5. 方案 B 需要在 fnOS 上安装 Node.js 运行时、HandBrake CLI、FFmpeg 等系统级依赖，维护成本极高

### 4.2 fpk 目录结构

```
handbrake-webui/
├── manifest                    # 应用元数据 (INI-style)
├── ICON.PNG                    # 应用图标 (256x256)
├── ICON_256.PNG                # 高清图标
├── app/
│   ├── ui/
│   │   └── config              # UI 入口配置 (JSON) - iframe 接入
│   ├── images/
│   │   └── icon.png            # UI 图标
│   └── ...                     # Docker 镜像相关 (在 cmd 中处理)
├── cmd/
│   ├── main                    # 生命周期管理脚本 (安装/启停/升级)
│   ├── install_init            # 安装前初始化
│   ├── install_callback        # 安装后回调
│   ├── uninstall_init          # 卸载前清理
│   ├── uninstall_callback      # 卸载后回调
│   ├── upgrade_init            # 升级前
│   ├── upgrade_callback        # 升级后
│   ├── service                 # systemd service 管理
│   ├── config                  # 配置生成
│   └── common                  # 公共函数
├── config/
│   ├── privilege               # 权限配置 (docker 设备透传)
│   └── resource                # 资源配置
└── scripts/                    # 辅助脚本
```

### 4.3 关键文件设计

#### 4.3.1 manifest

```ini
appname               = App.ThirdParty.HandBrakeWebui
version               = 1.0.0
display_name          = HandBrake 转码
desc                  = 基于 Web 界面的 HandBrake 视频转码管理工具，支持 Intel QSV / VA-API 硬件加速
platform              = x86
source                = thirdparty
maintainer            = ray5378
maintainer_url        = https://github.com/ray5378/HandBrake-Webui
distributor           = ray5378
distributor_url       = https://github.com/ray5378/HandBrake-Webui
os_min_version        = 0.9.27
ctl_stop              = true
desktop_uidir         = ui
desktop_applaunchname = App.ThirdParty.HandBrakeWebui.Web
service_port          = 52389
checkport             = false
```

#### 4.3.2 app/ui/config

```json
{
    ".url": {
        "App.ThirdParty.HandBrakeWebui.Web": {
            "title": "HandBrake 转码",
            "icon": "images/icon-{0}.png",
            "type": "iframe",
            "protocol": "http",
            "url": "/cgi/ThirdParty/App.ThirdParty.HandBrakeWebui/index.cgi/",
            "allUsers": true
        }
    }
}
```

#### 4.3.3 cmd/main — Docker 容器生命周期管理

主要逻辑：
- **安装**: 拉取 Docker 镜像 `ray5378/handbrake-webui:latest`，创建并启动容器
- **启动**: 启动已存在的容器
- **停止**: 停止容器
- **卸载**: 停止并删除容器（可选保留数据卷）

容器配置：
```bash
docker run -d \
  --name handbrake-webui \
  --restart unless-stopped \
  --network host \
  -v /var/apps/App.ThirdParty.HandBrakeWebui/var/config:/config \
  -v <user_data_path>:/drive \
  --device /dev/dri:/dev/dri \
  -e PORT=52389 \
  -e CONFIG_DIR=/config \
  ray5378/handbrake-webui:latest
```

### 4.4 数据持久化方案

| 数据 | 宿主机路径 | 容器内路径 | 说明 |
|---|---|---|---|
| 配置文件/数据库 | `/var/apps/App.ThirdParty.HandBrakeWebui/var/config` | `/config` | JWT密钥、SQLite数据库 |
| 视频文件 | 用户选择的数据目录 | `/drive` | 待转码视频 |
| GPU设备 | `/dev/dri` | `/dev/dri` | Intel QSV / VA-API |

---

## 5. 系统架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                    fnOS 桌面环境                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ 文件管理  │  │ 应用中心  │  │ HandBrake│  │   ...    │   │   │
│  │  │          │  │          │  │ 转码图标 │  │          │   │   │
│  │  └──────────┘  └──────────┘  └─────┬────┘  └──────────┘   │   │
│  └────────────────────────────────────┼───────────────────────┘   │
└───────────────────────────────────────┼───────────────────────────┘
                                        │ iframe
                                        ▼
               ┌─────────────────────────────────────────┐
               │       fnOS Nginx 反向代理 (/cgi/)        │
               └────────────────────┬────────────────────┘
                                    │ http://localhost:52389
               ┌────────────────────┴────────────────────┐
               │           Docker 容器                     │
               │  ┌──────────────────────────────────┐    │
               │  │   Node.js / Express Backend       │    │
               │  │   - Auth (JWT)                    │    │
               │  │   - File Management                │    │
               │  │   - Job Queue                      │    │
               │  │   - Preset Management              │    │
               │  │   - Serve React SPA                │    │
               │  ├──────────────────────────────────┤    │
               │  │   React Frontend (SPA)             │    │
               │  │   - Dashboard / Files / Jobs       │    │
               │  │   - Presets / Settings / Account   │    │
               │  ├──────────────────────────────────┤    │
               │  │   HandBrake CLI + FFmpeg           │    │
               │  ├──────────────────────────────────┤    │
               │  │   SQLite Database (better-sqlite3) │    │
               │  └──────────────────────────────────┘    │
               │                                          │
               │   mounts:                                 │
               │   /config  ←  /var/apps/.../var/config    │
               │   /drive   ←  <user_data_path>            │
               │   /dev/dri  ←  /dev/dri (GPU)             │
               └──────────────────────────────────────────┘
```

---

## 6. 模块与接口设计

### 6.1 现有 API 接口（保持不变）

所有 API 在迁移后保持完整兼容：

| 模块 | 路由前缀 | 功能 |
|---|---|---|
| Auth | `/api/auth` | 登录、注册、Token 刷新 |
| Files | `/api/files` | 文件列表、搜索、上传、删除 |
| Jobs | `/api/jobs` | 转码任务 CRUD、进度查询 |
| Presets | `/api/presets` | 预设管理 CRUD |
| System | `/api/system` | 系统信息、硬件检测 |
| Users | `/api/users` | 用户管理 |

### 6.2 关键数据库表（保持不变）

| 表名 | 说明 |
|---|---|
| `users` | 用户账号（用户名、密码哈希、角色） |
| `jobs` | 转码任务（源文件、目标参数、状态、进度） |
| `presets` | 转码预设（名称、视频/音频参数） |

### 6.3 环境变量映射

| 环境变量 | Docker 默认值 | fpk 配置方式 |
|---|---|---|
| `PORT` | `52389` | 固定，由 fnOS 代理访问 |
| `NODE_ENV` | `production` | 固定 |
| `JWT_SECRET` | 自动生成 | 持久化到 `/config/config.json` |
| `MAX_CONCURRENT_JOBS` | `2` | 可通过 Web UI 设置 |
| `CONFIG_DIR` | `/config` | 映射到持久化目录 |
| `LOG_LEVEL` | `INFO` | 可通过 Web UI 设置 |

---

## 7. 技术选型与关键决策

### 7.1 关键决策记录

| 决策 ID | 决策项 | 选择 | 备选方案 | 理由 |
|---|---|---|---|---|
| AD-01 | fpk 类型 | Docker-based | Native (Node.js) | 复用现有 Dockerfile，依赖管理简单 |
| AD-02 | 网络模式 | `host` | `bridge` | 简化网络配置，fnOS 通过 Unix socket 反向代理 |
| AD-03 | 数据持久化 | fpk var 目录 + 用户卷映射 | 纯 fpk var 目录 | 视频文件通常较大，用户需要自主选择存储位置 |
| AD-04 | 镜像源 | Docker Hub 官方 | 自建 Registry | 保持与现有发布流程一致 |
| AD-05 | 硬件加速 | 透传 `/dev/dri` | VAAPI 库内嵌 | 容器内已安装 VAAPI 驱动，透传设备即可 |

### 7.2 技术栈

| 组件 | 技术 | 说明 |
|---|---|---|
| 应用打包 | `fnpack` CLI | fnOS 官方打包工具 |
| 容器运行时 | Docker | fnOS 内置 Docker Engine |
| 基础镜像 | `node:20-bookworm-slim` | 现有 Dockerfile 基础镜像 |
| 转码引擎 | HandBrake CLI + FFmpeg | 现有依赖 |
| Web 框架 | Express + React | 现有技术栈 |

---

## 8. 任务拆解清单 (WBS)

### 阶段 1: 基础设施搭建 (预估: 2天)

| WBS ID | 任务名称 | 输出物 | 依赖 | 工时 |
|---|---|---|---|---|
| 1.1 | 安装并配置 `fnpack` 工具 | 可运行的 fnpack CLI | 无 | 0.5h |
| 1.2 | 创建 fpk 项目骨架 | 目录结构、manifest 文件 | 1.1 | 1h |
| 1.3 | 准备应用图标 (256x256 PNG) | ICON.PNG, ICON_256.PNG | 无 | 0.5h |
| 1.4 | 编写 `app/ui/config` UI 入口配置 | config JSON 文件 | 1.2 | 0.5h |
| 1.5 | 搭建 Docker 镜像发布流程 | 镜像推送脚本 | 无 | 2h |

### 阶段 2: 生命周期脚本开发 (预估: 4天)

| WBS ID | 任务名称 | 输出物 | 依赖 | 工时 |
|---|---|---|---|---|
| 2.1 | 编写 `cmd/main` 安装逻辑 | main 脚本 | 1.2 | 4h |
| 2.2 | 编写 `cmd/main` 启停逻辑 | main 脚本 | 2.1 | 2h |
| 2.3 | 编写 `cmd/main` 升级逻辑 | main 脚本 | 2.1 | 2h |
| 2.4 | 编写 `cmd/main` 卸载逻辑 | main 脚本 | 2.1 | 1h |
| 2.5 | 编写配置/权限脚本 (`config/privilege`) | privilege 配置文件 | 1.2 | 1h |
| 2.6 | 编写 `cmd/install_init` / `install_callback` | 安装回调脚本 | 2.1 | 2h |
| 2.7 | 编写 `cmd/uninstall_init` / `uninstall_callback` | 卸载回调脚本 | 2.1 | 1h |
| 2.8 | 编写 `cmd/upgrade_init` / `upgrade_callback` | 升级回调脚本 | 2.1 | 2h |

### 阶段 3: 集成与配置 (预估: 3天)

| WBS ID | 任务名称 | 输出物 | 依赖 | 工时 |
|---|---|---|---|---|
| 3.1 | 创建 fnOS Docker Compose 或 Docker Run 模板 | 容器启动命令 | 2.1 | 2h |
| 3.2 | 配置数据持久化路径映射 | 卷映射逻辑 | 2.1 | 1h |
| 3.3 | 配置硬件加速设备透传 | GPU 设备映射 | 2.5 | 1h |
| 3.4 | 配置 FN Connect 反向代理兼容 | 验证 iframe 访问 | 3.1 | 2h |
| 3.5 | 配置日志收集与轮转 | 日志脚本 | 2.1 | 1h |

### 阶段 4: 测试验证 (预估: 3天)

| WBS ID | 任务名称 | 输出物 | 依赖 | 工时 |
|---|---|---|---|---|
| 4.1 | 安装功能测试 (全新安装) | 测试报告 | 3.1 | 2h |
| 4.2 | 安装功能测试 (覆盖升级) | 测试报告 | 4.1 | 2h |
| 4.3 | 功能测试 (Web UI 全功能) | 测试报告 | 4.1 | 4h |
| 4.4 | 硬件加速测试 (QSV / VA-API) | 测试报告 | 4.1 | 2h |
| 4.5 | 启停/卸载测试 | 测试报告 | 4.1 | 1h |
| 4.6 | FN Connect 远程访问测试 | 测试报告 | 4.1 | 1h |

### 阶段 5: 文档与发布 (预估: 2天)

| WBS ID | 任务名称 | 输出物 | 依赖 | 工时 |
|---|---|---|---|---|
| 5.1 | 编写部署文档 | README / 部署手册 | 全部 | 2h |
| 5.2 | 编写用户手册 | 操作指南 | 全部 | 2h |
| 5.3 | 打包 fpk 并验证安装 | `HandBrakeWebui.fpk` | 全部 | 1h |
| 5.4 | 提交应用审核 (FnDepot / 应用中心) | 审核提交 | 5.3 | 1h |

**总计预估工时: 约 10-14 天 (单人开发)**

---

## 9. 开发任务卡

### 9.1 最高优先级 (P0 - MVP)

| 卡片 ID | 标题 | 优先级 | 预估工时 | 依赖 | 分配给 |
|---|---|---|---|---|---|
| T-001 | 创建 fpk 项目骨架 + manifest 配置 | P0 | 2h | 无 | - |
| T-002 | 实现 `cmd/main` 容器安装/启动/停止逻辑 | P0 | 8h | T-001 | - |
| T-003 | 实现 `app/ui/config` UI 入口配置 | P0 | 1h | T-001 | - |
| T-004 | 配置 `/dev/dri` 硬件加速透传 | P0 | 2h | T-002 | - |
| T-005 | 配置数据持久化目录映射 | P0 | 2h | T-002 | - |
| T-006 | fpk 打包与安装验证 | P0 | 1h | T-001~T-005 | - |
| T-007 | 端到端功能测试 (安装 → 转码 → 完成) | P0 | 4h | T-006 | - |

### 9.2 中优先级 (P1)

| 卡片 ID | 标题 | 优先级 | 预估工时 | 依赖 |
|---|---|---|---|---|
| T-008 | 实现升级回调逻辑 (配置迁移) | P1 | 2h | T-002 |
| T-009 | 实现卸载回调逻辑 (数据清理询问) | P1 | 1h | T-002 |
| T-010 | 编写 cmd/service 脚本 | P1 | 2h | T-002 |
| T-011 | 日志收集与轮转配置 | P1 | 1h | T-002 |
| T-012 | 应用图标设计与制作 | P1 | 1h | 无 |

### 9.3 低优先级 (P2)

| 卡片 ID | 标题 | 优先级 | 预估工时 | 依赖 |
|---|---|---|---|---|
| T-013 | fnOS 应用中心提交审核 | P2 | 1h | T-006 |
| T-014 | 自动化 CI 打包流程 (GitHub Actions) | P2 | 4h | T-006 |
| T-015 | ARM64 架构支持 | P2 | 8h | T-006 |

---

## 10. 测试计划

### 10.1 测试范围

| 测试类型 | 范围 | 策略 |
|---|---|---|
| 安装测试 | fpk 安装流程 | 在 fnOS 0.9.27+ 上手动安装验证 |
| 功能测试 | Web UI 全功能 | 回归所有核心功能 |
| 性能测试 | 转码性能 | 对比 Docker 原生部署的性能差异 |
| 兼容性测试 | 不同 fnOS 版本 | 至少验证 0.9.27 和最新版 |
| 稳定性测试 | 长时间运行 | 连续转码 24h 观察内存泄漏 |

### 10.2 测试环境

- **硬件**: x86_64 架构 NAS (建议 Intel 8 代+ CPU 以支持 QSV)
- **系统**: fnOS ≥ 0.9.27
- **依赖**: Docker Engine (fnOS 内置)

### 10.3 测试用例示例

| TC ID | 测试场景 | 前置条件 | 测试步骤 | 预期结果 |
|---|---|---|---|---|
| TC-01 | 全新安装 | 无 handbrake-webui 容器 | 安装 fpk → 检查桌面图标 → 点击打开 | 桌面生成图标，点击以 iframe 打开 Web UI |
| TC-02 | 覆盖升级 | 已安装旧版本 | 安装新版 fpk | 配置和数据保留，服务正常 |
| TC-03 | 视频转码 | 有可用的视频文件 | 登录 → 选择文件 → 选预设 → 提交任务 | 任务从 queued → running → completed |
| TC-04 | 硬件加速 | Intel CPU 带 QSV | 提交转码任务 → 查看日志 | 日志中出现 `qsv` 或 `vaapi` 加速信息 |
| TC-05 | 应用停止 | 应用正在运行 | 在应用中心停止应用 | Web UI 不可访问 |
| TC-06 | 应用启动 | 应用已停止 | 在应用中心启动应用 | Web UI 恢复访问 |

---

## 11. 部署手册

### 11.1 环境依赖

| 依赖 | 版本要求 | 说明 |
|---|---|---|
| fnOS | ≥ 0.9.27 | x86_64 架构 |
| Docker | fnOS 内置版本 | 无需额外安装 |
| HandBrake CLI | 容器内置 | 无需额外安装 |
| FFmpeg | 容器内置 | 无需额外安装 |

### 11.2 安装步骤

1. **下载 fpk 包**
   - 从 Release 页面下载 `HandBrakeWebui-x.x.x.fpk`

2. **安装应用**
   - 方式 A: 在 fnOS 应用中心 → 手动安装 → 选择 fpk 文件
   - 方式 B: SSH 执行 `appcenter-cli install-fpk HandBrakeWebui-x.x.x.fpk`

3. **首次使用**
   - 桌面上点击 "HandBrake 转码" 图标
   - 注册管理员账号（第一个注册用户自动成为管理员）
   - 导航到 "设置" 页面确认硬件加速状态

### 11.3 数据目录说明

| 目录 | 默认位置 | 说明 |
|---|---|---|
| 配置/数据库 | `/var/apps/App.ThirdParty.HandBrakeWebui/var/config/` | 包含 database.sqlite, config.json |
| 视频存储 | 用户首次使用时配置 | 建议映射到存储池中的媒体目录 |

### 11.4 回滚方案

```bash
# 1. 停止并卸载当前版本
appcenter-cli uninstall App.ThirdParty.HandBrakeWebui

# 2. 安装旧版本 fpk
appcenter-cli install-fpk HandBrakeWebui-x.x.x.fpk

# 注意：卸载时选择保留数据，以保留配置和数据库
```

---

## 12. 用户手册

### 12.1 快速入门

1. 安装后在桌面找到 **HandBrake 转码** 图标并点击
2. 注册一个新账号（首个注册用户为管理员）
3. 点击 **文件** 页面上传或浏览 NAS 中的视频文件
4. 选择一个视频文件，点击 **转码**
5. 选择转码预设（如 H.265 QSV 1080p），点击 **提交**
6. 在 **任务** 页面查看转码进度
7. 转码完成后，文件出现在转码输出目录中

### 12.2 硬件加速配置

进入 **设置** 页面，查看 "硬件加速" 部分：
- 显示 `Intel QSV: 可用` 或 `VA-API: 可用` 表示硬件加速正常
- 如果显示不可用，检查 `/dev/dri` 设备是否被正确透传

### 12.3 常见操作

- **添加转码预设**: 预设页面 → 新建 → 配置视频/音频参数
- **批量转码**: 文件页面 → 多选文件 → 批量转码
- **查看转码日志**: 任务页面 → 点击任务 → 查看日志

---

## 13. 常见问题 FAQ

### Q: 安装后桌面没有图标？
A: 请确保 fnOS 版本 ≥ 0.9.27，尝试重启应用中心或重新安装 fpk。

### Q: 转码速度很慢，没有硬件加速？
A: 确认 CPU 支持 QSV（Intel 6代+）或 VA-API（AMD），并检查 `/dev/dri` 设备是否存在：
```bash
ls -la /dev/dri
```

### Q: 如何重置管理员密码？
A: SSH 连接到 fnOS，执行：
```bash
docker exec -it handbrake-webui sqlite3 /config/database.sqlite "UPDATE users SET password='<新密码hash>' WHERE role='admin'"
```

### Q: 升级后配置丢失？
A: 升级时请确保选择了保留数据。如已丢失，可从备份中恢复 `/var/apps/App.ThirdParty.HandBrakeWebui/var/config/` 目录。

### Q: 应用占用空间太大？
A: Docker 镜像约 500MB-1GB。可通过 `docker system prune` 清理旧镜像。

---

## 14. 验收报告

> 待迁移完成后填写

| 验收项 | 状态 | 备注 |
|---|---|---|
| 应用中心安装 | ⬜ | |
| 桌面图标与 iframe 打开 | ⬜ | |
| 用户注册/登录 | ⬜ | |
| 文件管理 | ⬜ | |
| 视频转码 | ⬜ | |
| 硬件加速 | ⬜ | |
| FN Connect 远程访问 | ⬜ | |
| 应用启停管理 | ⬜ | |
| 升级数据保留 | ⬜ | |
| 卸载数据清理 | ⬜ | |

---

## 15. 总结复盘

> 待迁移完成后填写

| 项目 | 内容 |
|---|---|
| 实际耗时 | |
| 遇到的问题 | |
| 解决方案 | |
| 遗留问题 | |
| 改进建议 | |

---

## 附录

### A. 参考资源

- [FNOS 开发者文档](https://developer.fnnas.com/)
- [fnpack 工具使用指南](https://developer.fnnas.com/docs/quick-started/create-application)
- [HandBrake-Webui 源码](https://github.com/ray5378/HandBrake-Webui)
- [WatchCow - Docker 转 fpk 工具](https://github.com/tf4fun/watchcow)
- [FnDepot 应用源构建规范](https://gitee.com/hcg2003/FnDepot)

### B. 相关文件

- [架构设计文档](./architecture-handbrake-webui.md)
- [PRD 文档](./prd-handbrake-webui.md)