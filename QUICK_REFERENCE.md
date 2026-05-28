# HandBrake Web UI - 快速参考卡

## 🚀 快速启动

```bash
# Docker 部署
docker-compose up -d

# 访问
http://localhost:3000

# 管理员账号
用户名: admin
密码: changeme123
```

## 📝 常用命令

```bash
# Docker
docker-compose up -d        # 启动
docker-compose down          # 停止
docker-compose logs -f      # 查看日志
docker-compose restart      # 重启

# 代码检查
npm run lint                # ESLint 检查
npm run format              # 格式化代码
```

## 🔐 API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/refresh | 刷新 Token |
| GET | /api/files | 获取文件列表 |
| POST | /api/files/upload | 上传文件 |
| GET | /api/jobs | 获取任务列表 |
| POST | /api/jobs | 创建任务 |
| POST | /api/jobs/:id/cancel | 取消任务 |
| GET | /api/presets | 获取预设列表 |
| GET | /api/system/info | 系统信息 |

## 📁 目录映射

| 容器内路径 | 宿主机路径 | 用途 |
|-----------|-----------|------|
| /source | ./source | 源视频文件 |
| /output | ./output | 转码输出 |
| /config | ./config | 数据库和配置 |

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| ADMIN_USERNAME | admin | 管理员用户名 |
| ADMIN_PASSWORD | changeme123 | 管理员密码 |
| JWT_SECRET | (随机) | JWT 密钥 |
| MAX_CONCURRENT_JOBS | 2 | 最大并发任务数 |
| PORT | 3000 | 服务端口 |

## 🎬 支持的编码格式

**视频**
- H.264 (libx264)
- H.265/HEVC (libx265)
- VP9 (libvpx-vp9)

**音频**
- AAC
- Opus
- MP3

**容器**
- MP4
- MKV
- WebM

## 🛠️ 故障排查

### 服务启动失败
```bash
# 查看日志
docker-compose logs -f

# 检查端口占用
lsof -i :3000
```

### 文件权限问题
```bash
# 修复权限
chmod 777 -R source output config
```

### 数据库问题
```bash
# 删除数据库重新初始化
rm -f config/database.sqlite
docker-compose restart
```

## 📊 监控

- **健康检查**: http://localhost:3000/api/health
- **系统信息**: http://localhost:3000/api/system/info
- **目录映射**: http://localhost:3000/api/system/directories

## 🔒 安全建议

1. 修改默认管理员密码
2. 使用强 JWT_SECRET
3. 限制 API 访问频率
4. 定期备份数据库
5. 使用 HTTPS（反向代理）

## 📚 相关文档

- 项目总结: PROJECT_SUMMARY.md
- 产品需求: .trae/documents/prd-handbrake-webui.md
- 技术架构: .trae/documents/architecture-handbrake-webui.md
- 代码规范: .github/CODE_STYLE_CHECKLIST.md
