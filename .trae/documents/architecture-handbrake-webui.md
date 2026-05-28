# HandBrake Web UI 技术架构文档

## 1. 系统架构

### 1.1 整体架构图
```mermaid
graph TB
    subgraph Frontend
        A[React SPA] --> B[React Router]
        A --> C[Zustand Store]
        A --> D[Tailwind CSS]
    end
    
    subgraph Backend
        E[Node.js Express] --> F[Authentication Middleware]
        E --> G[Job Controller]
        E --> H[File Controller]
        E --> I[Preset Controller]
        E --> J[User Controller]
    end
    
    subgraph Services
        K[HandBrake Service] --> L[Child Process]
        K --> M[Queue Manager]
        N[File Service]
        O[Preset Service]
    end
    
    subgraph Data
        P[SQLite Database] --> Q[better-sqlite3]
        R[JSON Config Files]
    end
    
    A -->|HTTP/REST| E
    E --> K
    E --> N
    E --> O
    E --> P
```

### 1.2 技术栈

| 层级 | 技术选型 | 版本 |
|------|---------|------|
| 前端框架 | React | 18.x |
| 前端路由 | React Router | 6.x |
| 状态管理 | Zustand | 4.x |
| UI 组件 | Headless UI | 2.x |
| CSS 框架 | Tailwind CSS | 3.x |
| 构建工具 | Vite | 5.x |
| 后端框架 | Express | 4.x |
| 数据库 | SQLite | 3.x |
| ORM | better-sqlite3 | 9.x |
| 认证 | jsonwebtoken | 9.x |
| 密码加密 | bcryptjs | 2.x |
| 文件上传 | multer | 1.x |
| 容器化 | Docker | 24.x |
| 基础镜像 | Alpine Linux | 3.x |

## 2. 项目结构

```
handbrake-webui/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── jobController.js
│   │   │   ├── fileController.js
│   │   │   ├── presetController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validator.js
│   │   ├── services/
│   │   │   ├── handbrakeService.js
│   │   │   ├── queueService.js
│   │   │   ├── fileService.js
│   │   │   └── presetService.js
│   │   ├── models/
│   │   │   ├── database.js
│   │   │   └── schemas.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── jobs.js
│   │   │   ├── files.js
│   │   │   ├── presets.js
│   │   │   └── users.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   ├── config/
│   │   │   └── index.js
│   │   └── app.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── files/
│   │   │   ├── jobs/
│   │   │   └── settings/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Files.jsx
│   │   │   ├── Transcode.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── JobDetail.jsx
│   │   │   ├── Presets.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── package.json (workspace)
└── README.md
```

## 3. API 设计

### 3.1 认证接口

#### POST /api/auth/register
注册新用户

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "username": "string"
    }
  }
}
```

#### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "uuid",
      "username": "string",
      "role": "admin|user"
    }
  }
}
```

#### POST /api/auth/refresh
刷新 Token

**请求体:**
```json
{
  "refreshToken": "string"
}
```

### 3.2 文件接口

#### GET /api/files
获取文件列表

**查询参数:**
- `directory`: 目录路径 (默认 /source)
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

**响应:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "video.mp4",
        "path": "/source/video.mp4",
        "size": 1024000,
        "type": "video",
        "extension": ".mp4",
        "createdAt": "2024-01-01T00:00:00Z",
        "modifiedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### GET /api/files/info
获取文件信息

**查询参数:**
- `path`: 文件路径

**响应:**
```json
{
  "success": true,
  "data": {
    "name": "video.mp4",
    "path": "/source/video.mp4",
    "size": 1024000,
    "duration": 3600,
    "video": {
      "codec": "h264",
      "width": 1920,
      "height": 1080,
      "fps": 30
    },
    "audio": [
      {
        "codec": "aac",
        "channels": 2,
        "language": "eng"
      }
    ]
  }
}
```

#### POST /api/files/upload
上传文件

**请求:** multipart/form-data
- `file`: 文件
- `directory`: 目标目录 (默认 /source)

### 3.3 转码任务接口

#### GET /api/jobs
获取任务列表

**查询参数:**
- `status`: 状态过滤 (queued/processing/completed/failed/cancelled)
- `page`: 页码
- `limit`: 每页数量

**响应:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "uuid",
        "sourceFile": "/source/video.mp4",
        "outputFile": "/output/video.mp4",
        "preset": "web-1080p",
        "status": "processing",
        "progress": 45,
        "createdAt": "2024-01-01T00:00:00Z",
        "startedAt": "2024-01-01T00:01:00Z",
        "completedAt": null
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20
    }
  }
}
```

#### POST /api/jobs
创建转码任务

**请求体:**
```json
{
  "sourceFile": "/source/video.mp4",
  "outputFile": "/output/video-encoded.mp4",
  "preset": "web-1080p",
  "customSettings": {
    "crf": 23,
    "audioCodec": "aac",
    "audioBitrate": 128
  }
}
```

#### GET /api/jobs/:id
获取任务详情

#### DELETE /api/jobs/:id
删除任务

#### POST /api/jobs/:id/cancel
取消任务

#### POST /api/jobs/:id/pause
暂停任务

#### POST /api/jobs/:id/resume
恢复任务

### 3.4 预设接口

#### GET /api/presets
获取预设列表

**响应:**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "id": "uuid",
        "name": "Web 1080p",
        "description": "适合网页播放的 1080p 视频",
        "format": "mp4",
        "video": {
          "codec": "h264",
          "crf": 23,
          "preset": "medium",
          "width": 1920,
          "height": 1080
        },
        "audio": {
          "codec": "aac",
          "bitrate": 128,
          "channels": 2
        },
        "isBuiltIn": true
      }
    ]
  }
}
```

#### POST /api/presets
创建自定义预设

#### PUT /api/presets/:id
更新预设

#### DELETE /api/presets/:id
删除自定义预设

### 3.5 系统接口

#### GET /api/system/info
获取系统信息

**响应:**
```json
{
  "success": true,
  "data": {
    "handbrakeVersion": "1.7.0",
    "dockerVersion": "24.0.0",
    "uptime": 3600,
    "diskUsage": {
      "total": 1000000000000,
      "used": 500000000000,
      "free": 500000000000
    }
  }
}
```

#### GET /api/system/directories
获取目录映射信息

## 4. 数据模型

### 4.1 ER 图
```mermaid
erDiagram
    User ||--o{ Job : creates
    User {
        string id PK
        string username
        string password
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Job ||--|| Preset : uses
    Job {
        string id PK
        string userId FK
        string sourceFile
        string outputFile
        string presetId FK
        string status
        float progress
        text errorLog
        datetime createdAt
        datetime startedAt
        datetime completedAt
    }
    
    Preset {
        string id PK
        string name
        text description
        json settings
        boolean isBuiltIn
        datetime createdAt
    }
```

### 4.2 数据库表定义

#### users 表
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### jobs 表
```sql
CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    output_file TEXT NOT NULL,
    preset_id TEXT,
    status TEXT DEFAULT 'queued',
    progress REAL DEFAULT 0,
    error_log TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### presets 表
```sql
CREATE TABLE presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    settings TEXT NOT NULL,
    is_built_in INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 5. HandBrake CLI 集成

### 5.1 转码命令构建
```javascript
function buildHandBrakeCommand(job, preset) {
  const args = [
    '-i', job.sourceFile,
    '-o', job.outputFile,
    '--preset', preset.name,
    '--json'
  ];
  
  return `HandBrakeCLI ${args.join(' ')}`;
}
```

### 5.2 进度解析
HandBrake CLI 通过 JSON 输出或正则表达式解析进度:
```
Encoding: task 1 of 1, 45.234567 %
```

### 5.3 错误处理
- 捕获 stderr 输出
- 解析错误代码
- 记录完整日志

## 6. Docker 配置

### 6.1 Dockerfile
```dockerfile
FROM alpine:3.19

# 安装 Node.js 和 HandBrake
RUN apk add --no-cache \
    nodejs \
    npm \
    handbrake-cli \
    ffmpeg \
    && npm install -g npm

# 复制应用代码
COPY backend /app/backend
COPY frontend /app/frontend

# 安装依赖
WORKDIR /app/backend
RUN npm install --production

WORKDIR /app/frontend
RUN npm install && npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "/app/backend/server.js"]
```

### 6.2 docker-compose.yml
```yaml
version: '3.8'

services:
  handbrake-webui:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./config:/config
      - ./source:/source
      - ./output:/output
    environment:
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=changeme
      - JWT_SECRET=your-secret-key
      - MAX_CONCURRENT_JOBS=2
    restart: unless-stopped
```

## 7. 安全策略

### 7.1 JWT 配置
- Access Token 有效期: 1 小时
- Refresh Token 有效期: 7 天
- Token 签名算法: HS256

### 7.2 密码策略
- 最小长度: 8 字符
- 密码加密: bcrypt (cost factor 12)

### 7.3 API 安全
- 所有接口需要认证 (除了 /auth/*)
- 文件上传大小限制: 10GB
- 请求速率限制: 100 请求/分钟

## 8. 性能优化

### 8.1 前端优化
- React.lazy 路由懒加载
- 图片和视频懒加载
- 虚拟列表处理大文件列表
- 状态管理优化 (Zustand)

### 8.2 后端优化
- SQLite 连接池
- 数据库查询优化 (索引)
- 流式文件处理
- 任务队列管理

### 8.3 HandBrake 优化
- 硬件加速 (如果可用)
- 合理的并发任务数
- 任务优先级管理

## 9. 代码规范

### 9.1 通用规范

#### 9.1.1 格式化要求
- **缩进**: 使用 2 个空格
- **行宽**: 最大 100 字符
- **换行**: 每条语句单独一行
- **引号**: 字符串使用单引号

#### 9.1.2 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `userName`, `filePath` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONCURRENT_JOBS` |
| 函数 | camelCase (动词开头) | `getUserById`, `handleUpload` |
| 类名 | PascalCase | `HandBrakeService` |
| 组件 | PascalCase | `UserProfile`, `JobCard` |
| 文件名 | kebab-case | `user-service.js`, `job-card.jsx` |
| 数据库表 | snake_case (复数) | `users`, `job_tasks` |
| API 路由 | kebab-case (名词复数) | `/api/user-accounts` |

#### 9.1.3 注释规范
```javascript
// ✅ 正确: 使用简洁注释
// 计算总页数
const totalPages = Math.ceil(total / limit);

// ❌ 错误: 无用注释
// 这是一个 for 循环
for (let i = 0; i < 10; i++) {
  // 做点什么
  doSomething();
}
```

### 9.2 JavaScript/Node.js 规范

#### 9.2.1 模块导入顺序
```javascript
// 1. Node.js 内置模块
const fs = require('fs');
const path = require('path');

// 2. 第三方模块
const express = require('express');
const jwt = require('jsonwebtoken');

// 3. 本地模块 (使用相对路径)
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

// 4. 类型定义 (如果有)
const UserModel = require('../models/user');

// 排序规则: 按字母顺序排列同一级别的导入
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
```

#### 9.2.2 错误处理
```javascript
// ✅ 正确: 统一错误处理格式
async function createUser(userData) {
  try {
    // 业务逻辑
    const user = await db.insert('users', userData);
    return { success: true, data: user };
  } catch (error) {
    console.error('Failed to create user:', error);
    return {
      success: false,
      error: error.message || '创建用户失败'
    };
  }
}

// ❌ 错误: 吞掉错误
function badFunction() {
  try {
    doSomething();
  } catch (e) {
    // 什么都不做
  }
}

// ✅ 正确: 自定义错误类型
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```

#### 9.2.3 异步编程
```javascript
// ✅ 正确: 使用 async/await
async function getUserById(id) {
  const user = await database.query(
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
  return user;
}

// ❌ 错误: 回调地狱
function getUserById(id, callback) {
  database.query('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return callback(err);
    callback(null, user);
  });
}
```

#### 9.2.4 变量声明
```javascript
// ✅ 正确: 使用 const 和 let
const MAX_RETRY = 3;
let currentCount = 0;

// ❌ 错误: 使用 var
var oldStyle = 'avoid this';
```

#### 9.2.5 函数设计
```javascript
// ✅ 正确: 函数保持简洁，单一职责
function validateUserInput(data) {
  const errors = [];
  
  if (!data.username) {
    errors.push({ field: 'username', message: '用户名不能为空' });
  }
  
  if (data.password && data.password.length < 6) {
    errors.push({ field: 'password', message: '密码至少6位' });
  }
  
  return errors;
}

// ❌ 错误: 函数过长，职责不清
function doEverything(data) {
  // 100+ 行代码
}
```

### 9.3 React/前端规范

#### 9.3.1 组件结构
```jsx
// ✅ 正确: 清晰的组件结构
function UserCard({ user, onEdit, onDelete }) {
  // 1. Hooks
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. 事件处理函数
  const handleEdit = () => {
    setIsEditing(true);
    onEdit(user.id);
  };
  
  // 3. 渲染
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="actions">
        <button onClick={handleEdit}>编辑</button>
        <button onClick={() => onDelete(user.id)}>删除</button>
      </div>
    </div>
  );
}

// ❌ 错误: 内联函数过多
function BadComponent() {
  return items.map(item => (
    <div 
      key={item.id}
      onClick={() => handleClick(item.id)}
      onMouseEnter={() => setHovered(item.id)}
    >
      {item.name}
    </div>
  ));
}
```

#### 9.3.2 Props 规范
```jsx
// ✅ 正确: 使用 PropTypes 或 TypeScript
import PropTypes from 'prop-types';

function JobCard({ job, onCancel, onDelete }) {
  JobCard.propTypes = {
    job: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['queued', 'processing', 'completed']).isRequired,
      progress: PropTypes.number
    }).isRequired,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
  };
  
  return <div className="job-card">{/* ... */}</div>;
}

// ✅ 正确: 解构 props
function Component({ title, description, onSubmit, disabled = false }) {
  return <div>{/* ... */}</div>;
}

// ❌ 错误: 不使用 defaultProps 或默认值
function Component(props) {
  // 假设 disabled 默认为 false
}
```

#### 9.3.3 状态管理
```javascript
// ✅ 正确: Zustand store 结构
import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      set({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));

// ❌ 错误: 过多 useState
function BadComponent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  // ... 更多 useState
}
```

#### 9.3.4 Hooks 规范
```javascript
// ✅ 正确: 自定义 Hook 提取逻辑
function useJobs(filter) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchJobs(filter).then(setJobs);
  }, [filter]);
  
  return { jobs, loading };
}

// ✅ 正确: 依赖数组完整
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// ❌ 错误: 缺少依赖
useEffect(() => {
  fetchUser(userId);
  // 缺少 userId 依赖
}, []);
```

### 9.4 API 设计规范

#### 9.4.1 RESTful 规范
```javascript
// ✅ 正确: RESTful 路由设计
// 获取资源列表
router.get('/users', getUsers);

// 获取单个资源
router.get('/users/:id', getUserById);

// 创建资源
router.post('/users', createUser);

// 更新资源
router.put('/users/:id', updateUser);
router.patch('/users/:id', partialUpdateUser);

// 删除资源
router.delete('/users/:id', deleteUser);

// ❌ 错误: 动词在 URL 中
router.get('/getUsers');
router.post('/createUser');
router.post('/updateUser');
router.post('/deleteUser');
```

#### 9.4.2 响应格式
```javascript
// ✅ 正确: 统一响应格式
// 成功响应
res.status(200).json({
  success: true,
  data: {
    id: 'uuid',
    name: 'User'
  }
});

// 错误响应
res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: [
    { field: 'email', message: 'Invalid email format' }
  ]
});

// 创建成功 (201)
res.status(201).json({
  success: true,
  data: { id: 'uuid' },
  message: 'Resource created successfully'
});

// ❌ 错误: 响应格式不一致
res.json({ status: 'ok', result: data });
res.json({ success: true });
res.send('Done');
```

#### 9.4.3 HTTP 状态码
| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取/更新资源 |
| 201 | Created | 成功创建资源 |
| 204 | No Content | 成功删除（无返回体） |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 500 | Internal Server Error | 服务器错误 |

### 9.5 Git 提交规范

#### 9.5.1 Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例:**
```bash
# ✅ 正确
git commit -m "feat(jobs): add job progress tracking"
git commit -m "fix(auth): resolve token refresh issue"
git commit -m "docs(api): update API documentation"
git commit -m "refactor(file): simplify file upload logic"

// ❌ 错误
git commit -m "updated code"
git commit -m "fix bug"
git commit -m "WIP"
```

#### 9.5.2 分支命名
```bash
# ✅ 正确
feature/user-authentication
feature/video-upload
fix/token-refresh
hotfix/security-patch
release/v1.0.0

# ❌ 错误
new-feature
fix_for_bug
MyBranch
```

### 9.6 代码检查配置

#### 9.6.1 ESLint (后端)
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": "warn",
    "no-console": "off",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### 9.6.2 ESLint (前端 React)
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "plugins": ["react"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "warn",
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

#### 9.6.3 Prettier 配置
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 9.7 代码审查清单

#### 9.7.1 PR 提交前自检
- [ ] 代码符合格式化规范
- [ ] ESLint 检查通过
- [ ] 所有测试通过
- [ ] 导入了必要的依赖
- [ ] 没有硬编码的敏感信息
- [ ] API 响应格式一致
- [ ] 错误处理完整
- [ ] 注释清晰（必要时）
- [ ] 提交信息符合规范

#### 9.7.2 Code Review 重点
- **安全性**: 是否有 SQL 注入、XSS、CSRF 风险
- **性能**: 是否有 N+1 查询、不必要的重渲染
- **可维护性**: 代码是否清晰、职责是否单一
- **测试覆盖**: 关键逻辑是否有测试
- **边界情况**: 错误处理是否完整
