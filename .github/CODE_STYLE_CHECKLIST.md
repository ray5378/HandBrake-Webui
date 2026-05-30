# 代码规范检查清单

## 提交前必检项目

### 1. 代码格式 ✅
- [ ] 使用 2 个空格缩进
- [ ] 行宽不超过 100 字符
- [ ] 字符串使用单引号
- [ ] 语句末尾有分号
- [ ] 文件末尾有空行

### 2. 命名规范 ✅
- [ ] 变量使用 camelCase
- [ ] 常量使用 UPPER_SNAKE_CASE
- [ ] 函数使用 camelCase（动词开头）
- [ ] React 组件使用 PascalCase
- [ ] 文件名使用 kebab-case
- [ ] 数据库表使用 snake_case

### 3. 注释规范 ✅
- [ ] 关键逻辑有必要的注释
- [ ] 避免无意义的注释
- [ ] JSDoc 格式的函数说明
- [ ] 复杂算法有解释说明

### 4. 错误处理 ✅
- [ ] 所有异步操作有 try-catch
- [ ] 错误有日志记录
- [ ] API 响应格式统一
- [ ] 用户友好的错误提示

### 5. 安全性 ✅
- [ ] 无硬编码的敏感信息
- [ ] 使用环境变量管理配置
- [ ] SQL 查询使用参数化
- [ ] 输入输出有验证

### 6. 性能 ✅
- [ ] 无不必要的重渲染（React）
- [ ] 数据库查询有索引
- [ ] 大文件处理使用流
- [ ] 避免 N+1 查询

### 7. 可维护性 ✅
- [ ] 函数保持简洁（< 50 行）
- [ ] 单一职责原则
- [ ] 无重复代码（DRY）
- [ ] 模块职责清晰

### 8. UI 规范 ✅
- [ ] 无原生 alert()、confirm()、prompt() 调用
- [ ] 提示通知使用自定义 Toast 组件
- [ ] 确认/危险操作使用 ConfirmDialog 组件
- [ ] 用户输入使用 Modal 对话框组件

## Git 提交规范 ✅

### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- [ ] `feat` - 新功能
- [ ] `fix` - Bug 修复
- [ ] `docs` - 文档更新
- [ ] `style` - 代码格式
- [ ] `refactor` - 重构
- [ ] `perf` - 性能优化
- [ ] `test` - 测试相关
- [ ] `chore` - 构建/工具

### 示例
```bash
# ✅ 正确
git commit -m "feat(jobs): add job progress tracking"
git commit -m "fix(auth): resolve token refresh issue"

# ❌ 错误
git commit -m "fix bug"
git commit -m "WIP"
git commit -m "updated"
```

## 分支命名规范 ✅

- [ ] `feature/` - 新功能分支
- [ ] `fix/` - Bug 修复分支
- [ ] `hotfix/` - 紧急修复分支
- [ ] `release/` - 发布分支

## Pull Request 规范 ✅

### PR 内容
- [ ] 标题清晰描述改动
- [ ] 描述改动的目的和范围
- [ ] 关联相关 Issue
- [ ] 列出测试步骤

### PR 检查清单
- [ ] 代码通过所有测试
- [ ] 代码通过 ESLint 检查
- [ ] 代码格式符合规范
- [ ] 文档已更新（如需要）
- [ ] 无敏感信息泄露

## 代码审查重点 ✅

### 审查者关注
- **功能性**: 功能是否按需求实现
- **安全性**: 是否有安全漏洞
- **性能**: 是否有性能问题
- **可维护性**: 代码是否清晰易懂
- **测试覆盖**: 关键逻辑是否有测试

### 被审查者准备
- [ ] 自检完成所有清单项
- [ ] 准备好测试步骤
- [ ] 准备好演示环境
- [ ] 准备好回答问题

## 常用检查命令

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm test

# 构建检查
npm run build
```

## 持续集成 ✅

项目已配置以下 CI 检查：
- [ ] ESLint 检查
- [ ] Prettier 格式检查
- [ ] 构建成功检查
- [ ] TypeScript 类型检查（如使用）
