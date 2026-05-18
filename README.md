# SpreadJS 协同编辑系统

基于 SpreadJS 的实时协同编辑系统，支持多人同时编辑电子表格。

## 技术栈

### 前端

- React 18 + TypeScript
- Vite 5
- Ant Design 5
- Socket.io Client
- @grapecity-software/spread-sheets
- @grapecity-software/spread-sheets-collaboration-client

### 后端

- Express.js + TypeScript
- Prisma ORM
- PostgreSQL 16
- Socket.io
- @grapecity-software/js-collaboration
- Winston Logger

## 项目结构

```
spreadDemo/
├── client/          # 前端项目
├── server/          # 后端项目
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 16
- Docker (可选)

### 1. 安装依赖

```bash
# 安装所有依赖
npm install

# 或分别安装
cd client && npm install
cd server && npm install
```

### 2. 配置并初始化数据库

#### 方式一：使用 Docker Compose（推荐）

```bash
docker-compose up -d postgres
```

#### 方式二：本地 PostgreSQL

确保 PostgreSQL 已启动，创建数据库：

```bash
psql -U postgres -c "CREATE DATABASE spreadjs;"
```

#### 生成 Prisma Client

```bash
cd server
npm run db:generate
npm run db:push
```

### 3. 启动服务

```bash
# 方式一：同时启动前后端
npm run dev

# 方式二：分别启动
npm run dev:server  # 后端（http://localhost:3000）
npm run dev:client  # 前端（http://localhost:5173）
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000

## 主要功能

- 用户认证（JWT）
- 文档 CRUD
- 实时协同编辑
- 快照管理
- 操作历史
- 文档分享
- 用户在线状态

## API 文档

### 用户认证

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/me` - 获取当前用户

### 文档管理

- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 创建文档
- `GET /api/documents/:id` - 获取文档详情
- `PUT /api/documents/:id` - 更新文档
- `DELETE /api/documents/:id` - 删除文档
- `POST /api/documents/:id/share` - 分享文档

### 快照管理

- `GET /api/documents/:id/snapshots` - 获取快照列表
- `POST /api/documents/:id/snapshots` - 创建快照

### 变更集管理

- `GET /api/documents/:id/changesets` - 获取变更集列表
- `GET /api/documents/:id/changesets/:changesetId` - 获取变更集详情

## 开发指南

### 代码规范

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint
```

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 环境变量

#### 后端环境变量（server/.env）

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://spreadjs:spreadjs123@localhost:5432/spreadjs
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173
LOG_DIR=./logs
LOG_MAX_FILES=180d
```

#### 前端环境变量（client/.env）

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 日志

日志文件位于 `server/logs/` 目录，按日期自动轮转，保留 180 天。

- `application-YYYY-MM-DD.log` - 应用日志
- `error-YYYY-MM-DD.log` - 错误日志
- `ws-YYYY-MM-DD.log` - WebSocket 日志

## 统一返回格式

所有 API 返回统一的数据结构：

```json
{
  "code": 0,
  "data": {},
  "message": "操作成功"
}
```

### 错误码定义

| 错误码 | 说明           |
| ------ | -------------- |
| 0      | 成功           |
| 1001   | 参数错误       |
| 1002   | 认证失败       |
| 1003   | 无权访问       |
| 1004   | 资源不存在     |
| 2001   | 文档操作失败   |
| 2002   | 快照保存失败   |
| 2003   | 变更集同步失败 |
| 5001   | 服务器内部错误 |

## 常见问题

### 1. Prisma Client 未初始化

**错误**：`@prisma/client did not initialize`

**解决**：

```bash
cd server
npx prisma generate
npx prisma db push
```

### 2. 数据库认证失败

**错误**：`Authentication failed` 或 `Access denied`

**解决**：

1. 检查 PostgreSQL 是否启动
2. 确认 `.env` 中的密码与 PostgreSQL 密码一致
3. 运行 `npm run db:generate` 和 `npm run db:push` 重新初始化

### 3. 数据库连接错误

**错误**：`Could not connect to database`

**解决**：

1. 确保 PostgreSQL 正在运行：
   ```bash
   docker ps | grep postgres
   ```
2. 如果未运行，启动 PostgreSQL：
   ```bash
   docker-compose up -d postgres
   ```

### 4. 端口占用

**错误**：`EADDRINUSE`

**解决**：修改 `.env` 文件中的 `PORT` 配置，或停止占用端口的进程

### 5. 依赖安装失败

**解决**：

```bash
# 清理 node_modules 并重新安装
cd server
rm -rf node_modules package-lock.json
npm install
```

## 项目模块说明

### 后端模块（server/src/）

- **config/** - 配置文件（数据库、JWT）
- **controllers/** - 控制器层
- **services/** - 服务层（业务逻辑）
- **routes/** - 路由定义
- **middleware/** - 中间件（认证、错误处理）
- **collaboration/** - 协作逻辑处理
- **logger/** - 日志系统
- **types/** - TypeScript 类型定义

### 前端模块（client/src/）

- **components/** - React 组件
  - **spreadsheet/** - 表格编辑器组件
- **pages/** - 页面组件
- **hooks/** - 自定义 Hooks
- **services/api/** - API 服务层
- **stores/** - 状态管理（React Context）

## License

MIT
