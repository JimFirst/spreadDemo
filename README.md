# SpreadJS 协同编辑系统

基于 SpreadJS 的实时协同编辑系统，支持多人同时编辑电子表格。

## 技术栈

### 前端

- React 18 + TypeScript
- Vite 5
- Ant Design 5
- Socket.io Client
- @grapecity/spread-sheets

### 后端

- Express.js + TypeScript
- Prisma ORM
- MySQL 8.0
- Socket.io
- Winston Logger

## 项目结构

```
spreadjs/
├── client/          # 前端项目
├── server/          # 后端项目
├── docker-compose.yml
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0
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

#### 方式一：使用初始化脚本（推荐）

```bash
# 进入后端目录
cd server

# 运行初始化脚本（自动创建数据库 + Prisma 配置）
npm run db:init
```

#### 方式二：手动初始化

```bash
# 进入后端目录
cd server

# 1. 创建数据库（使用 docker-compose）
docker-compose up -d mysql

# 2. 创建数据库（本地 MySQL）
#    确保 MySQL 已启动，并使用正确的密码（默认：123456）
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 生成 Prisma Client（重要！）
npm run db:generate

# 4. 推送数据库 schema 到 MySQL
npm run db:push
```

#### 数据库配置

环境变量配置在 `server/.env` 文件中：

```env
DATABASE_URL=mysql://root:123456@localhost:3306/spreadjs
```

**注意**：如果 MySQL 密码不是 `123456`，请修改 `.env` 文件中的密码。

### 3. 启动服务

```bash
# 方式一：使用 monorepo 脚本同时启动前后端
npm run dev

# 方式二：分别启动
npm run dev:server  # 后端（http://localhost:3000）
npm run dev:client  # 前端（http://localhost:5173）
```

### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000

## 主要功能

- ✅ 用户认证（JWT）
- ✅ 文档 CRUD
- ✅ 实时协同编辑
- ✅ 快照管理
- ✅ 操作历史
- ✅ 文档分享

## API 文档

### 文档管理

- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 创建文档
- `GET /api/documents/:id` - 获取文档详情
- `PUT /api/documents/:id` - 更新文档
- `DELETE /api/documents/:id` - 删除文档

### 快照管理

- `GET /api/documents/:id/snapshots` - 获取快照列表
- `POST /api/documents/:id/snapshots` - 创建快照

### 变更集管理

- `GET /api/documents/:id/changesets` - 获取变更集列表
- `GET /api/documents/:id/changesets/:changesetId` - 获取变更集详情

## WebSocket 事件

- `join-document` - 加入文档协作
- `leave-document` - 离开文档协作
- `changeset` - 发送变更集
- `changeset-sync` - 变更集同步

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

详细配置请参考 `.env.example` 文件。

#### 后端环境变量（server/.env）

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/spreadjs
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

1. 检查 MySQL 是否启动
2. 确认 `.env` 中的密码与 MySQL root 密码一致（默认：`123456`）
3. 运行 `npm run db:init` 重新初始化

### 3. 数据库连接错误

**错误**：`Can't connect to MySQL server`

**解决**：

1. 确保 MySQL 正在运行：
   ```bash
   docker ps | grep mysql
   ```
2. 如果未运行，启动 MySQL：
   ```bash
   docker-compose up -d mysql
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

### 6. 初始化脚本执行失败

**解决**：手动执行：

```bash
cd server

# 创建数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS spreadjs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 生成 Prisma Client
npx prisma generate

# 推送 Schema
npx prisma db push

# 启动服务器
npm run dev
```

## 项目模块说明

### 后端模块（server/src/）

- **config/** - 配置文件（数据库、JWT）
- **controllers/** - 控制器层
- **services/** - 服务层（业务逻辑）
- **routes/** - 路由定义
- **middleware/** - 中间件（认证、错误处理）
- **websocket/** - WebSocket 处理
- **logger/** - 日志系统
- **types/** - TypeScript 类型定义

### 前端模块（client/src/）

- **components/** - React 组件
- **pages/** - 页面组件
- **hooks/** - 自定义 Hooks
- **services/** - API 服务层
- **stores/** - 状态管理

## License

MIT
