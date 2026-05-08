# SpreadJS 协同编辑系统重构设计方案

> **项目目标：** 将现有的 SpreadJS 协同编辑项目重构为前后端分离架构
> **日期：** 2026-05-06
> **状态：** 待审核

---

## 1. 项目概述

### 1.1 项目背景

将现有的 SpreadJS 协同编辑项目从单体架构重构为前后端分离架构，提升代码可维护性、可扩展性和团队协作效率。

### 1.2 技术栈

**前端：**

- **构建工具**：Vite 5.x（官方 React + TypeScript 模板）
- **框架**：React 18.x + TypeScript 5.x
- **UI 组件库**：Ant Design 5.x
- **路由**：React Router v6
- **状态管理**：React Context + Hooks
- **HTTP 客户端**：Axios
- **WebSocket**：Socket.io-client
- **电子表格**：@grapecity/spread-sheets 18.2.5
- **代码规范**：ESLint + Prettier + Husky

**后端：**

- **运行环境**：Node.js 18+
- **框架**：Express.js 4.x + TypeScript 5.x
- **数据库**：MySQL 8.0
- **ORM**：Prisma
- **WebSocket**：Socket.io
- **API 风格**：RESTful
- **认证**：JWT Token（由网关统一颁发）
- **日志**：Winston + Morgan（按天记录，保留 180 天）
- **代码规范**：ESLint + Prettier + Husky

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────┐
│    网关层        │
│  (统一鉴权)      │
└──────┬──────────┘
       │ JWT Token
       ▼
┌─────────────────┐
│   Express API    │
│  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│    MySQL DB      │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│   WebSocket     │
│  (实时协同)      │
└─────────────────┘
```

### 2.2 MVC 分层架构

#### Model 层（数据模型）

- **位置**：`server/src/models/`
- **职责**：
  - 定义数据结构和业务模型
  - 使用 Prisma ORM 映射数据库表
  - 数据验证和转换

#### View 层（路由和控制器）

- **位置**：`server/src/routes/` + `server/src/controllers/`
- **职责**：
  - 处理 HTTP 请求和响应
  - 路由定义和中间件组合
  - 参数验证和错误处理

#### Controller 层（业务逻辑）

- **位置**：`server/src/controllers/`
- **职责**：
  - 业务逻辑处理
  - 调用 Service 层
  - 协调多个数据模型操作

#### Service 层（服务）

- **位置**：`server/src/services/`
- **职责**：
  - 核心业务逻辑封装
  - 事务管理和数据一致性
  - 与外部服务交互

### 2.3 前端项目结构

```
client/                      # 前端项目
├── src/
│   ├── components/         # 通用组件
│   │   ├── common/        # 通用 UI 组件
│   │   ├── spreadsheet/   # 电子表格相关组件
│   │   └── layout/       # 布局组件
│   ├── pages/            # 页面
│   │   ├── DocumentList/ # 文档列表页
│   │   ├── DocumentEdit/ # 文档编辑页
│   │   └── NotFound/     # 404 页面
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useDocument.ts
│   │   ├── useWebSocket.ts
│   │   └── useAuth.ts
│   ├── services/         # API 服务
│   │   ├── api/         # Axios 实例和拦截器
│   │   ├── document.service.ts
│   │   └── user.service.ts
│   ├── stores/          # 状态管理
│   │   ├── AuthContext.tsx
│   │   └── DocumentContext.tsx
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
└── index.html
```

### 2.4 后端项目结构

```
server/                      # 后端项目
├── src/
│   ├── config/            # 配置文件
│   │   ├── database.ts    # 数据库配置
│   │   ├── jwt.ts        # JWT 配置
│   │   └── env.ts        # 环境变量
│   ├── models/           # 数据模型（Prisma Schema）
│   │   └── schema.prisma
│   ├── controllers/      # 控制器
│   │   ├── document.controller.ts
│   │   ├── collaboration.controller.ts
│   │   └── user.controller.ts
│   ├── services/         # 服务层
│   │   ├── document.service.ts
│   │   ├── snapshot.service.ts
│   │   └── user.service.ts
│   ├── routes/          # 路由定义
│   │   ├── user.routes.ts
│   │   ├── document.routes.ts
│   │   ├── snapshot.routes.ts
│   │   └── index.ts
│   ├── middleware/       # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── websocket/       # WebSocket 模块
│   │   ├── handler.ts
│   │   ├── rooms.ts
│   │   └── index.ts
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   ├── app.ts          # Express 应用入口
│   ├── server.ts       # 服务器启动文件
│   └── logger/         # 日志模块
│       ├── index.ts    # 日志配置入口
│       ├── format.ts   # 日志格式化
│       └── rotate.ts   # 日志轮转配置
├── prisma/
│   └── migrations/     # 数据库迁移
├── tests/             # 测试文件
├── package.json
├── tsconfig.json
├── .eslintrc.cjs
└── .prettierrc
```

---

## 3. 数据库设计

### 3.1 ER 图

```
┌─────────────────┐       ┌─────────────────┐
│     User        │       │    Document     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ externalId      │◄──────│ creatorId (FK)   │
│ username        │       │ title           │
│ email           │       │ createdAt       │
│ createdAt       │       │ updatedAt       │
└─────────────────┘       └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    Snapshot     │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ documentId (FK) │
                         │ data            │
                         │ version         │
                         │ createdAt       │
                         └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    ChangeSet    │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ documentId (FK) │
                         │ snapshotId (FK)  │
                         │ ops             │
                         │ userId (FK)     │
                         │ createdAt       │
                         └─────────────────┘

┌─────────────────┐
│ DocumentMember  │
├─────────────────┤
│ id (PK)         │
│ documentId (FK)  │
│ userId (FK)      │
│ role             │
│ createdAt       │
└─────────────────┘
```

### 3.2 表结构定义

#### User 表

```prisma
model User {
  id          String   @id @default(uuid())
  externalId  String   @unique  // 网关中的用户 ID
  username    String
  email       String?
  createdAt   DateTime @default(now())

  documents   Document[]
  changesets ChangeSet[]
  members    DocumentMember[]
}
```

#### Document 表

```prisma
model Document {
  id          String   @id @default(uuid())
  title       String
  creatorId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  creator     User     @relation(fields: [creatorId], references: [id])
  snapshots   Snapshot[]
  changesets ChangeSet[]
  members    DocumentMember[]
}
```

#### Snapshot 表

```prisma
model Snapshot {
  id          String   @id @default(uuid())
  documentId  String
  data        Json     // 完整的电子表格快照
  version     Int      @default(1)
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id])
  changesets  ChangeSet[]
}
```

#### ChangeSet 表

```prisma
model ChangeSet {
  id          String   @id @default(uuid())
  documentId  String
  snapshotId  String
  userId      String
  ops         Json     // 变更操作列表
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id])
  snapshot    Snapshot @relation(fields: [snapshotId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}
```

#### DocumentMember 表

```prisma
model DocumentMember {
  id          String   @id @default(uuid())
  documentId  String
  userId      String
  role        String   @default("editor") // viewer, editor, owner
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@unique([documentId, userId])
}
```

---

## 4. API 设计

### 4.1 统一返回格式

所有 RESTful API 返回统一的数据结构：

```typescript
// 成功响应
{
  code: 0,
  data: { ... },      // 实际数据
  message: "操作成功"
}

// 错误响应
{
  code: 1001,         // 错误码
  data: null,
  message: "参数错误"
}

// 分页响应
{
  code: 0,
  data: {
    list: [...],
    pagination: {
      total: 100,
      page: 1,
      pageSize: 20
    }
  },
  message: "查询成功"
}
```

#### 错误码定义

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

### 4.2 RESTful API 路由

#### 用户相关

| 方法 | 路径           | 描述             | 权限   |
| ---- | -------------- | ---------------- | ------ |
| GET  | /api/users/me  | 获取当前用户信息 | 已认证 |
| GET  | /api/users/:id | 获取用户信息     | 已认证 |

#### 文档管理

| 方法   | 路径                               | 描述             | 权限       |
| ------ | ---------------------------------- | ---------------- | ---------- |
| GET    | /api/documents                     | 获取我的文档列表 | 已认证     |
| POST   | /api/documents                     | 创建文档         | 已认证     |
| GET    | /api/documents/:id                 | 获取文档详情     | 文档成员   |
| PUT    | /api/documents/:id                 | 更新文档         | 文档成员   |
| DELETE | /api/documents/:id                 | 删除文档         | 文档所有者 |
| POST   | /api/documents/:id/share           | 分享文档         | 文档所有者 |
| GET    | /api/documents/:id/members         | 获取成员列表     | 文档成员   |
| DELETE | /api/documents/:id/members/:userId | 移除成员         | 文档所有者 |

#### 快照管理

| 方法 | 路径                                     | 描述         | 权限     |
| ---- | ---------------------------------------- | ------------ | -------- |
| GET  | /api/documents/:id/snapshots             | 获取快照列表 | 文档成员 |
| POST | /api/documents/:id/snapshots             | 创建快照     | 文档成员 |
| GET  | /api/documents/:id/snapshots/:snapshotId | 获取快照详情 | 文档成员 |

#### 变更集管理

| 方法 | 路径                                       | 描述           | 权限     |
| ---- | ------------------------------------------ | -------------- | -------- |
| GET  | /api/documents/:id/changesets              | 获取变更集列表 | 文档成员 |
| GET  | /api/documents/:id/changesets/:changesetId | 获取变更集详情 | 文档成员 |

### 4.3 WebSocket 事件

#### 客户端 → 服务器

```typescript
// 加入文档房间
{ event: 'join-document', payload: { documentId: string } }

// 离开文档房间
{ event: 'leave-document', payload: { documentId: string } }

// 发送变更集
{ event: 'changeset', payload: { documentId: string, ops: Operation[] } }

// 请求同步
{ event: 'sync', payload: { documentId: string, version: number } }
```

#### 服务器 → 客户端

```typescript
// 用户加入通知
{ event: 'user-joined', payload: { userId: string, userName: string } }

// 用户离开通知
{ event: 'user-left', payload: { userId: string } }

// 变更集同步
{ event: 'changeset-sync', payload: { userId: string, ops: Operation[] } }

// 快照更新
{ event: 'snapshot-update', payload: { snapshot: Snapshot } }

// 错误消息
{ event: 'error', payload: { code: string, message: string } }
```

---

## 5. 认证和授权

### 5.1 JWT Token 验证流程

```
网关（颁发 Token）
    │
    │ Authorization: Bearer <token>
    │
    ▼
Express API
    │
    ▼
auth.middleware.ts
    │
    ├─→ 验证 Token 签名
    │
    ├─→ 解析 Token 获取用户信息
    │   {
    │     sub: "user-id",
    │     name: "username",
    │     exp: 1234567890
    │   }
    │
    ▼
req.user = { id, username, email }
    │
    ▼
Controller 处理业务逻辑
```

### 5.2 中间件实现

```typescript
// middleware/auth.middleware.ts
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "未提供认证 Token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.sub,
      username: decoded.name,
      email: decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token 无效或已过期" });
  }
};
```

### 5.3 文档权限控制

```typescript
// middleware/document-access.middleware.ts
export const documentAccessMiddleware = async (req, res, next) => {
  const documentId = req.params.id;
  const userId = req.user.id;

  const membership = await prisma.documentMember.findUnique({
    where: {
      documentId_userId: { documentId, userId },
    },
  });

  if (!membership) {
    return res.status(403).json({ error: "无权访问此文档" });
  }

  req.documentRole = membership.role;
  next();
};
```

---

## 6. 协同编辑核心逻辑

### 6.1 WebSocket 连接管理

```typescript
// websocket/handler.ts
export class CollaborationHandler {
  private rooms: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, string> = new Map();

  handleConnection(socket: Socket) {
    const userId = socket.handshake.auth.userId;
    this.userSockets.set(socket.id, userId);

    socket.on("join-document", ({ documentId }) =>
      this.joinDocument(socket, documentId),
    );
    socket.on("leave-document", ({ documentId }) =>
      this.leaveDocument(socket, documentId),
    );
    socket.on("changeset", ({ documentId, ops }) =>
      this.handleChangeSet(socket, documentId, ops),
    );
    socket.on("disconnect", () => this.handleDisconnect(socket));
  }

  private async joinDocument(socket: Socket, documentId: string) {
    // 加入房间
    socket.join(documentId);

    // 获取文档成员
    const members = await this.getDocumentMembers(documentId);

    // 通知其他用户
    socket.to(documentId).emit("user-joined", {
      userId: socket.handshake.auth.userId,
      userName: socket.handshake.auth.userName,
    });

    // 发送当前在线用户列表
    socket.emit("users-online", { users: members });
  }

  private async handleChangeSet(
    socket: Socket,
    documentId: string,
    ops: Operation[],
  ) {
    // 保存变更集到数据库
    const snapshot = await this.saveChangeSet(documentId, ops);

    // 广播给房间内所有用户（包括发送者）
    io.to(documentId).emit("changeset-sync", {
      userId: socket.handshake.auth.userId,
      ops,
      version: snapshot.version,
    });
  }
}
```

### 6.2 快照和变更集管理

```typescript
// services/snapshot.service.ts
export class SnapshotService {
  async createSnapshot(documentId: string, data: any): Promise<Snapshot> {
    const lastSnapshot = await this.getLatestSnapshot(documentId);
    const version = lastSnapshot ? lastSnapshot.version + 1 : 1;

    return prisma.snapshot.create({
      data: {
        documentId,
        data,
        version,
      },
    });
  }

  async addChangeSet(
    documentId: string,
    userId: string,
    ops: Operation[],
  ): Promise<ChangeSet> {
    const latestSnapshot = await this.getLatestSnapshot(documentId);

    return prisma.changeSet.create({
      data: {
        documentId,
        snapshotId: latestSnapshot.id,
        userId,
        ops,
      },
    });
  }

  async getDocumentHistory(documentId: string, limit: number = 50) {
    return prisma.snapshot.findMany({
      where: { documentId },
      orderBy: { version: "desc" },
      take: limit,
    });
  }
}
```

---

## 7. 日志系统

### 7.1 日志架构

使用 Winston + Morgan 实现企业级日志系统：

```typescript
// logger/index.ts
import winston from "winston";
import morgan from "morgan";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

// Winston 配置
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    // 按日期记录日志，自动轮转
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "application-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "180d", // 保留 180 天（半年）
      maxSize: "20m",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    // 错误日志单独记录
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxFiles: "180d",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

// Morgan 中间件配置
export const morganMiddleware = morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
  skip: (req, res) => res.statusCode < 400, // 只记录错误请求
});
```

### 7.2 日志格式

```json
{
  "timestamp": "2026-05-06 10:30:15",
  "level": "info",
  "message": "REST API 请求处理",
  "service": "spreadjs-api",
  "userId": "user-xxx",
  "documentId": "doc-xxx",
  "operation": "createDocument",
  "duration": 45,
  "status": "success",
  "metadata": {
    "query": "mutation { createDocument(title: \"...\" }",
    "variables": { "title": "..." }
  }
}
```

### 7.3 日志分类

| 日志类型       | 文件名模式                 | 说明               | 保留时间 |
| -------------- | -------------------------- | ------------------ | -------- |
| 应用日志       | application-YYYY-MM-DD.log | 所有业务操作日志   | 180 天   |
| 错误日志       | error-YYYY-MM-DD.log       | 错误和异常日志     | 180 天   |
| HTTP 访问日志  | access-YYYY-MM-DD.log      | HTTP 请求日志      | 180 天   |
| WebSocket 日志 | ws-YYYY-MM-DD.log          | WebSocket 连接日志 | 180 天   |

### 7.4 日志级别

```typescript
enum LogLevel {
  ERROR = 0, // 错误：需要立即处理
  WARN = 1, // 警告：潜在问题
  INFO = 2, // 信息：正常业务流程
  DEBUG = 3, // 调试：开发环境详细日志
}

// 使用示例
logger.error("数据库连接失败", { error: err, stack: err.stack });
logger.warn("用户权限不足", { userId, resourceId });
logger.info("文档创建成功", { documentId, userId });
logger.debug("REST API 路由匹配完成", { path, method });
```

### 7.5 结构化日志字段

```typescript
interface LogEntry {
  timestamp: string; // 时间戳
  level: string; // 日志级别
  message: string; // 日志消息
  service: string; // 服务名称
  environment: string; // 环境（dev/staging/prod）

  // 业务相关字段
  userId?: string; // 用户 ID
  documentId?: string; // 文档 ID
  operation?: string; // 操作类型

  // 性能相关
  duration?: number; // 操作耗时（毫秒）

  // 上下文
  requestId?: string; // 请求追踪 ID
  correlationId?: string; // 关联 ID

  // 错误信息
  error?: {
    code: string;
    message: string;
    stack?: string;
  };

  // 元数据
  metadata?: Record<string, any>;
}
```

---

## 8. 前端核心实现

### 8.1 电子表格组件

```typescript
// components/spreadsheet/SpreadsheetEditor.tsx
import React, { useRef, useEffect } from 'react';
import GC from '@grapecity/spread-sheets';
import { useDocument } from '@/hooks/useDocument';
import { useWebSocket } from '@/hooks/useWebSocket';

export const SpreadsheetEditor: React.FC = () => {
  const spreadRef = useRef<GC.Spread.Sheets.Workbook>(null);
  const { document: doc, isLoading } = useDocument();
  const { sendChangeSet, onChangeSet, onSnapshotUpdate } = useWebSocket();

  useEffect(() => {
    if (!doc) return;

    // 初始化 SpreadJS
    const spread = new GC.Spread.Sheets.Workbook(
      document.getElementById('ss')
    );
    spreadRef.current = spread;

    // 加载初始快照
    if (doc.latestSnapshot) {
      loadSnapshot(spread, doc.latestSnapshot.data);
    }

    // 监听变更
    const sheet = spread.getActiveSheet();
    sheet.bind(GC.Spread.Sheets.Events.CellChanged, handleCellChange);

    return () => {
      sheet.unbind(GC.Spread.Sheets.Events.CellChanged, handleCellChange);
    };
  }, [doc]);

  const handleCellChange = (sender, args) => {
    const changeSet = captureCurrentState(spreadRef.current);
    sendChangeSet(changeSet);
  };

  onChangeSet((data) => {
    applyChangeSet(spreadRef.current, data.ops);
  });

  onSnapshotUpdate((snapshot) => {
    loadSnapshot(spreadRef.current, snapshot.data);
  });

  if (isLoading) return <Spin />;

  return <div id="ss" style={{ width: '100%', height: '600px' }} />;
};
```

### 8.2 WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

export const useWebSocket = (documentId: string) => {
  const socketRef = useRef<Socket>();
  const { user } = useAuth();

  useEffect(() => {
    socketRef.current = io(process.env.VITE_WS_URL, {
      auth: {
        userId: user.id,
        userName: user.username,
      },
    });

    socketRef.current.emit("join-document", { documentId });

    return () => {
      socketRef.current?.emit("leave-document", { documentId });
      socketRef.current?.disconnect();
    };
  }, [documentId, user]);

  const sendChangeSet = useCallback(
    (ops) => {
      socketRef.current?.emit("changeset", { documentId, ops });
    },
    [documentId],
  );

  const onChangeSet = useCallback((callback) => {
    socketRef.current?.on("changeset-sync", callback);
  }, []);

  const onSnapshotUpdate = useCallback((callback) => {
    socketRef.current?.on("snapshot-update", callback);
  }, []);

  return {
    sendChangeSet,
    onChangeSet,
    onSnapshotUpdate,
  };
};
```

---

## 9. 代码规范配置

### 9.1 ESLint 配置（前后端统一）

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
```

### 9.2 Prettier 配置

```json
// .prettierrc
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "jsxBracketSameLine": false
}
```

### 9.3 Husky 配置（Git Hooks）

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 10. 部署配置

### 10.1 环境变量

#### 后端 (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/spreadjs
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173
```

#### 前端 (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### 10.2 Docker Compose（可选）

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: spreadjs
      MYSQL_USER: spreadjs
      MYSQL_PASSWORD: spreadjs123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://spreadjs:spreadjs123@mysql:3306/spreadjs
    depends_on:
      - mysql

  client:
    build: ./client
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000/api
      VITE_WS_URL: http://localhost:3000
    depends_on:
      - server

volumes:
  mysql_data:
```

---

## 11. 开发工作流

### 11.1 启动开发服务器

```bash
# 后端
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# 前端
cd client
npm install
npm run dev
```

### 11.2 提交代码

```bash
# 提交信息格式
git commit -m "feat: 添加文档分享功能
>
> - 实现文档分享 API
> - 添加成员管理界面
> - 集成 WebSocket 通知"

# 类型
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关
```

---

## 12. 验收标准

### 12.1 功能验收

- [ ] 用户可以通过 JWT Token 访问 API
- [ ] 可以创建、编辑、删除文档
- [ ] 可以分享文档给其他用户
- [ ] 多个用户可以实时协同编辑同一文档
- [ ] 变更集自动保存到数据库
- [ ] 可以查看文档历史版本
- [ ] 用户权限控制生效

### 12.2 代码质量验收

- [ ] 所有代码符合 ESLint 规范
- [ ] 代码格式统一（Prettier）
- [ ] TypeScript 类型完整，无 any 类型滥用
- [ ] API 有适当的错误处理
- [ ] WebSocket 连接有重连机制
- [ ] 敏感信息不硬编码在代码中

### 12.3 测试验收

- [ ] 后端单元测试覆盖核心业务逻辑
- [ ] 前端组件有基本的功能测试
- [ ] WebSocket 通信有集成测试

---

## 13. 风险和注意事项

### 13.1 已知风险

1. **WebSocket 连接稳定性**
   - 风险：网络波动导致连接断开
   - 缓解：实现自动重连和变更集缓存

2. **并发冲突**
   - 风险：多个用户同时修改同一单元格
   - 缓解：后端使用乐观锁，广播冲突给用户

3. **性能瓶颈**
   - 风险：大文档快照数据量过大
   - 缓解：实现增量快照和压缩

### 13.2 安全注意事项

1. JWT Token 需要设置合理的过期时间
2. 数据库操作需要防止 SQL 注入
3. REST API 需要限制请求频率和复杂度
4. WebSocket 需要验证用户权限

---

## 14. 后续优化方向

1. **性能优化**
   - 实现增量快照，减少数据传输
   - 添加 Redis 缓存
   - 优化数据库查询

2. **功能扩展**
   - 支持更多电子表格功能（图表、数据透视表）
   - 添加评论和批注功能
   - 实现文档导出（Excel、PDF）

3. **运维监控**
   - 添加日志系统
   - 实现性能监控
   - 添加告警机制

---

## 附录

### A. 技术文档链接

- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)
- [Ant Design 官方文档](https://ant.design/)
- [Express.js 官方文档](https://expressjs.com/)
- [Prisma 官方文档](https://www.prisma.io/)
- [Socket.io 官方文档](https://socket.io/)
- [SpreadJS 官方文档](https://www.grapecity.com/spreadjs/)

### B. 相关规范

- [RESTful API 设计规范](https://restfulapi.net/)
- [HTTP 状态码指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [TypeScript 风格指南](https://google.github.io/styleguide/tsguide.html)

---

**文档版本：** 1.0
**最后更新：** 2026-05-06
**作者：** AI Assistant
