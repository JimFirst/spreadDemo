# SpreadJS 协同编辑系统重构 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将 SpreadJS 协同编辑项目重构为前后端分离架构，包含用户认证、文档管理、协同编辑、快照管理和完整日志系统

**架构：** 前后端分离架构，前端使用 React + Vite，后端使用 Express + TypeScript + MySQL，MVC 分层设计

**技术栈：**

- 前端：Vite + React + TypeScript + Ant Design + SpreadJS
- 后端：Express + TypeScript + MySQL + Prisma + Socket.io
- 代码规范：ESLint + Prettier + Husky
- 日志：Winston + Morgan

---

## 项目结构概览

```
spreadDemo/
├── client/                    # 前端项目（React + Vite）
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── services/         # API 服务
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── server/                    # 后端项目（Express + TypeScript）
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 服务层
│   │   ├── routes/          # 路由定义
│   │   ├── middleware/       # 中间件
│   │   ├── models/           # Prisma 数据模型
│   │   ├── websocket/        # WebSocket 模块
│   │   ├── logger/           # 日志模块
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # 类型定义
│   │   ├── app.ts           # Express 应用入口
│   │   └── server.ts        # 服务器启动
│   └── package.json
│
├── docs/                      # 文档
└── package.json             # 根目录 package.json
```

---

## 阶段一：项目初始化（基础搭建）

### 阶段目标：搭建前后端项目基础结构，配置代码规范

### Task 1: 初始化前端项目（Vite + React + TypeScript）

**Files:**

- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/.eslintrc.cjs`
- Create: `client/.prettierrc`
- Create: `client/.gitignore`
- Create: `client/index.html`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "spreadjs-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "antd": "^5.11.0",
    "@ant-design/icons": "^5.2.6",
    "axios": "^1.6.2",
    "@grapecity/spread-sheets": "^18.2.5",
    "socket.io-client": "^4.6.0",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.4",
    "prettier": "^3.1.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: 创建 .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
```

- [ ] **Step 5: 创建 .prettierrc**

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

- [ ] **Step 6: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SpreadJS 协同编辑</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd/dist/reset.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 8: 创建 src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocumentListPage from './pages/DocumentList'
import DocumentEditPage from './pages/DocumentEdit'
import { AuthProvider } from './stores/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/:id" element={<DocumentEditPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 9: 创建 src/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Step 10: 提交代码**

```bash
cd client
git init
git add .
git commit -m "feat: initialize frontend project structure with Vite + React + TypeScript"
```

---

### Task 2: 初始化后端项目（Express + TypeScript）

**Files:**

- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.eslintrc.cjs`
- Create: `server/.prettierrc`
- Create: `server/.gitignore`
- Create: `server/.env.example`
- Create: `server/src/app.ts`
- Create: `server/src/server.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "spreadjs-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext ts --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts --fix",
    "format": "prettier --write src",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^5.6.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "socket.io": "^4.6.0",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "dayjs": "^1.11.10",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/morgan": "^1.9.9",
    "@types/node": "^20.9.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "eslint": "^8.53.0",
    "prettier": "^3.1.0",
    "prisma": "^5.6.0",
    "tsx": "^4.6.0",
    "typescript": "^5.2.2"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建 .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
```

- [ ] **Step 4: 创建 .prettierrc**

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

- [ ] **Step 5: 创建 .env.example**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/spreadjs
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173
LOG_DIR=./logs
LOG_MAX_FILES=180d
```

- [ ] **Step 6: 创建 src/types/index.ts**

```typescript
import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  documentRole?: "viewer" | "editor" | "owner";
}

export interface ApiResponse<T = any> {
  code: number;
  data: T | null;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    list: T[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
    };
  };
}
```

- [ ] **Step 7: 创建 src/app.ts**

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { logger, morganMiddleware } from "./logger/index.js";
import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import snapshotRoutes from "./routes/snapshot.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morganMiddleware);

app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/documents", authMiddleware, documentRoutes);
app.use("/api/documents/:documentId/snapshots", authMiddleware, snapshotRoutes);

app.use(errorMiddleware);

export default app;
```

- [ ] **Step 8: 创建 src/server.ts**

```typescript
import "dotenv/config";
import app from "./app.js";
import { createServer } from "http";
import { initializeWebSocket } from "./websocket/index.js";
import { logger } from "./logger/index.js";
import { prisma } from "./config/database.js";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initializeWebSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
  });
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  await prisma.$disconnect();
  process.exit(0);
});
```

- [ ] **Step 9: 创建 src/config/database.ts**

```typescript
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

prisma.$connect().then(() => {
  console.log("Database connected successfully");
});
```

- [ ] **Step 10: 提交代码**

```bash
cd server
git init
git add .
git commit -m "feat: initialize backend project structure with Express + TypeScript"
```

---

## 阶段二：数据库和日志系统

### Task 3: 设计并创建数据库 Schema

**Files:**

- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: 创建 Prisma Schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  externalId  String   @unique
  username    String
  email       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  documents   Document[]
  changesets  ChangeSet[]
  members     DocumentMember[]

  @@index([externalId])
}

model Document {
  id          String   @id @default(uuid())
  title       String
  creatorId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  creator     User     @relation(fields: [creatorId], references: [id])
  snapshots   Snapshot[]
  changesets  ChangeSet[]
  members     DocumentMember[]

  @@index([creatorId])
}

model Snapshot {
  id          String   @id @default(uuid())
  documentId  String
  data        Json
  version     Int      @default(1)
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  changesets  ChangeSet[]

  @@index([documentId])
}

model ChangeSet {
  id          String   @id @default(uuid())
  documentId  String
  snapshotId  String
  userId      String
  ops         Json
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  snapshot    Snapshot @relation(fields: [snapshotId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@index([documentId])
  @@index([userId])
}

model DocumentMember {
  id          String   @id @default(uuid())
  documentId  String
  userId      String
  role        String   @default("editor")
  createdAt   DateTime @default(now())

  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@unique([documentId, userId])
  @@index([documentId])
  @@index([userId])
}
```

- [ ] **Step 2: 生成 Prisma Client**

```bash
cd server
npm run db:generate
```

- [ ] **Step 3: 提交代码**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema for User, Document, Snapshot, ChangeSet, DocumentMember"
```

---

### Task 4: 实现日志系统

**Files:**

- Create: `server/src/logger/index.ts`
- Create: `server/src/logger/format.ts`

- [ ] **Step 1: 创建日志格式化工具**

```typescript
// src/logger/format.ts
import winston from "winston";

export const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = "";
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);
```

- [ ] **Step 2: 创建日志主模块**

```typescript
// src/logger/index.ts
import winston from "winston";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { logFormat, consoleFormat } from "./format.js";

const logDir = process.env.LOG_DIR || "./logs";
const maxFiles = process.env.LOG_MAX_FILES || "180d";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles,
    level: "error",
    format: logFormat,
  }),
  new winston.transports.File({
    filename: path.join(logDir, "ws-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles,
    format: logFormat,
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles,
    maxSize: "20m",
    format: logFormat,
  }),
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  defaultMeta: {
    service: "spreadjs-api",
    environment: process.env.NODE_ENV,
  },
  transports,
});

export const morganMiddleware = morgan("combined", {
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { type: "http_access" });
    },
  },
  skip: () => process.env.NODE_ENV === "test",
});
```

- [ ] **Step 3: 创建使用示例**

```typescript
// 使用示例
logger.info("服务器启动", { port: 3000 });
logger.error("数据库连接失败", { error: err.message, stack: err.stack });
logger.warn("用户权限不足", { userId: "xxx", resourceId: "yyy" });
logger.debug("请求参数验证通过", { params: req.params });
```

- [ ] **Step 4: 提交代码**

```bash
git add src/logger/
git commit -m "feat: implement Winston logger with daily rotation and multiple transports"
```

---

## 阶段三：认证和用户管理

### Task 5: 实现 JWT 认证中间件

**Files:**

- Create: `server/src/middleware/auth.middleware.ts`
- Create: `server/src/config/jwt.ts`

- [ ] **Step 1: 创建 JWT 配置**

```typescript
// src/config/jwt.ts
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  name: string;
  email?: string;
}

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || "default-secret";
  return jwt.verify(token, secret) as JwtPayload;
};

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || "default-secret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
```

- [ ] **Step 2: 创建认证中间件**

```typescript
// src/middleware/auth.middleware.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { verifyToken } from "../config/jwt.js";
import { logger } from "../logger/index.js";

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        code: 1002,
        data: null,
        message: "未提供认证 Token",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.sub,
      username: decoded.name,
      email: decoded.email,
    };

    logger.debug("用户认证成功", {
      userId: req.user.id,
      path: req.path,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.error("Token 验证失败", {
      error: error instanceof Error ? error.message : "Unknown error",
      path: req.path,
    });

    return res.status(401).json({
      code: 1002,
      data: null,
      message: "Token 无效或已过期",
    });
  }
};
```

- [ ] **Step 3: 创建错误处理中间件**

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../logger/index.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error("请求处理错误", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      data: null,
      message: err.message,
    });
  }

  return res.status(500).json({
    code: 5001,
    data: null,
    message: "服务器内部错误",
  });
};
```

- [ ] **Step 4: 提交代码**

```bash
git add src/middleware/ src/config/jwt.ts
git commit -m "feat: implement JWT authentication middleware and error handling"
```

---

### Task 6: 实现用户服务和路由

**Files:**

- Create: `server/src/services/user.service.ts`
- Create: `server/src/controllers/user.controller.ts`
- Create: `server/src/routes/user.routes.ts`

- [ ] **Step 1: 创建用户服务**

```typescript
// src/services/user.service.ts
import { prisma } from "../config/database.js";
import { logger } from "../logger/index.js";

export class UserService {
  async findOrCreate(externalId: string, username: string, email?: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { externalId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            externalId,
            username,
            email,
          },
        });
        logger.info("新用户创建", { userId: user.id, username });
      }

      return user;
    } catch (error) {
      logger.error("用户查找/创建失败", {
        error: error instanceof Error ? error.message : "Unknown error",
        externalId,
      });
      throw error;
    }
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async findByExternalId(externalId: string) {
    return prisma.user.findUnique({
      where: { externalId },
    });
  }
}

export const userService = new UserService();
```

- [ ] **Step 2: 创建用户控制器**

```typescript
// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { AuthenticatedRequest } from "../types/index.js";

export class UserController {
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await userService.findById(userId);

      if (!user) {
        return res.status(404).json({
          code: 1004,
          data: null,
          message: "用户不存在",
        });
      }

      res.json({
        code: 0,
        data: user,
        message: "获取用户信息成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({
          code: 1004,
          data: null,
          message: "用户不存在",
        });
      }

      res.json({
        code: 0,
        data: user,
        message: "获取用户信息成功",
      });
    } catch (error) {
      throw error;
    }
  }
}

export const userController = new UserController();
```

- [ ] **Step 3: 创建用户路由**

```typescript
// src/routes/user.routes.ts
import { Router } from "express";
import { userController } from "../controllers/user.controller.js";

const router = Router();

router.get("/me", (req, res, next) => userController.getMe(req, res, next));
router.get("/:id", (req, res, next) =>
  userController.getUserById(req, res, next),
);

export default router;
```

- [ ] **Step 4: 提交代码**

```bash
git add src/services/user.service.ts src/controllers/user.controller.ts src/routes/user.routes.ts
git commit -m "feat: implement user service, controller and routes"
```

---

## 阶段四：文档管理核心功能

### Task 7: 实现文档 CRUD 功能

**Files:**

- Create: `server/src/services/document.service.ts`
- Create: `server/src/controllers/document.controller.ts`
- Create: `server/src/routes/document.routes.ts`
- Create: `server/src/middleware/document-access.middleware.ts`

- [ ] **Step 1: 创建文档访问控制中间件**

```typescript
// src/middleware/document-access.middleware.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { prisma } from "../config/database.js";

export const documentAccessMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const documentId = req.params.id || req.params.documentId;
    const userId = req.user!.id;

    const membership = await prisma.documentMember.findUnique({
      where: {
        documentId_userId: { documentId, userId },
      },
    });

    if (!membership) {
      return res.status(403).json({
        code: 1003,
        data: null,
        message: "无权访问此文档",
      });
    }

    req.documentRole = membership.role as "viewer" | "editor" | "owner";
    next();
  } catch (error) {
    next(error);
  }
};

export const documentOwnerMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.documentRole !== "owner") {
    return res.status(403).json({
      code: 1003,
      data: null,
      message: "需要文档所有者权限",
    });
  }
  next();
};
```

- [ ] **Step 2: 创建文档服务**

```typescript
// src/services/document.service.ts
import { prisma } from "../config/database.js";
import { logger } from "../logger/index.js";

export class DocumentService {
  async create(title: string, creatorId: string) {
    try {
      const document = await prisma.document.create({
        data: {
          title,
          creatorId,
          members: {
            create: {
              userId: creatorId,
              role: "owner",
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      logger.info("文档创建成功", {
        documentId: document.id,
        title: document.title,
        creatorId,
      });

      return document;
    } catch (error) {
      logger.error("文档创建失败", {
        error: error instanceof Error ? error.message : "Unknown error",
        title,
        creatorId,
      });
      throw error;
    }
  }

  async findAll(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.document.count({
        where: {
          members: {
            some: { userId },
          },
        },
      }),
    ]);

    return {
      list: documents,
      pagination: {
        total,
        page,
        pageSize,
      },
    };
  }

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        snapshots: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
  }

  async update(id: string, title: string) {
    const document = await prisma.document.update({
      where: { id },
      data: { title },
    });

    logger.info("文档更新成功", { documentId: id, title });

    return document;
  }

  async delete(id: string) {
    await prisma.document.delete({
      where: { id },
    });

    logger.info("文档删除成功", { documentId: id });
  }

  async share(documentId: string, userId: string, role: string) {
    const member = await prisma.documentMember.create({
      data: {
        documentId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    logger.info("文档分享成功", { documentId, userId, role });

    return member;
  }

  async removeMember(documentId: string, userId: string) {
    await prisma.documentMember.delete({
      where: {
        documentId_userId: { documentId, userId },
      },
    });

    logger.info("文档成员移除", { documentId, userId });
  }

  async getMembers(documentId: string) {
    return prisma.documentMember.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }
}

export const documentService = new DocumentService();
```

- [ ] **Step 3: 创建文档控制器**

```typescript
// src/controllers/document.controller.ts
import { Request, Response } from "express";
import { documentService } from "../services/document.service.js";
import { AuthenticatedRequest } from "../types/index.js";
import { AppError } from "../middleware/error.middleware.js";

export class DocumentController {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;
      const userId = req.user!.id;

      if (!title) {
        throw new AppError(400, 1001, "文档标题不能为空");
      }

      const document = await documentService.create(title, userId);

      res.status(201).json({
        code: 0,
        data: document,
        message: "文档创建成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await documentService.findAll(userId, page, pageSize);

      res.json({
        code: 0,
        data: result,
        message: "获取文档列表成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await documentService.findById(id);

      if (!document) {
        throw new AppError(404, 1004, "文档不存在");
      }

      res.json({
        code: 0,
        data: document,
        message: "获取文档详情成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        throw new AppError(400, 1001, "文档标题不能为空");
      }

      const document = await documentService.update(id, title);

      res.json({
        code: 0,
        data: document,
        message: "文档更新成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await documentService.delete(id);

      res.json({
        code: 0,
        data: null,
        message: "文档删除成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async share(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;

      if (!userId || !role) {
        throw new AppError(400, 1001, "用户 ID 和角色不能为空");
      }

      const member = await documentService.share(id, userId, role);

      res.status(201).json({
        code: 0,
        data: member,
        message: "文档分享成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, userId } = req.params;
      await documentService.removeMember(id, userId);

      res.json({
        code: 0,
        data: null,
        message: "成员移除成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await documentService.getMembers(id);

      res.json({
        code: 0,
        data: members,
        message: "获取成员列表成功",
      });
    } catch (error) {
      throw error;
    }
  }
}

export const documentController = new DocumentController();
```

- [ ] **Step 4: 创建文档路由**

```typescript
// src/routes/document.routes.ts
import { Router } from "express";
import { documentController } from "../controllers/document.controller.js";
import {
  documentAccessMiddleware,
  documentOwnerMiddleware,
} from "../middleware/document-access.middleware.js";

const router = Router();

router.post("/", (req, res, next) => documentController.create(req, res, next));
router.get("/", (req, res, next) => documentController.findAll(req, res, next));
router.get("/:id", documentAccessMiddleware, (req, res, next) =>
  documentController.findById(req, res, next),
);
router.put("/:id", documentAccessMiddleware, (req, res, next) =>
  documentController.update(req, res, next),
);
router.delete(
  "/:id",
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) => documentController.delete(req, res, next),
);
router.post(
  "/:id/share",
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) => documentController.share(req, res, next),
);
router.get("/:id/members", documentAccessMiddleware, (req, res, next) =>
  documentController.getMembers(req, res, next),
);
router.delete(
  "/:id/members/:userId",
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) => documentController.removeMember(req, res, next),
);

export default router;
```

- [ ] **Step 5: 更新 app.ts 添加新路由**

```typescript
// 在 app.ts 中添加
import snapshotRoutes from "./routes/snapshot.routes.js";
import documentRoutes from "./routes/document.routes.js";
```

- [ ] **Step 6: 提交代码**

```bash
git add src/services/document.service.ts src/controllers/document.controller.ts src/routes/document.routes.ts src/middleware/document-access.middleware.ts
git commit -m "feat: implement document CRUD with access control"
```

---

### Task 8: 实现快照和变更集管理

**Files:**

- Create: `server/src/services/snapshot.service.ts`
- Create: `server/src/controllers/snapshot.controller.ts`
- Create: `server/src/routes/snapshot.routes.ts`

- [ ] **Step 1: 创建快照服务**

```typescript
// src/services/snapshot.service.ts
import { prisma } from "../config/database.js";
import { logger } from "../logger/index.js";

export class SnapshotService {
  async create(documentId: string, data: any) {
    try {
      const lastSnapshot = await this.getLatest(documentId);
      const version = lastSnapshot ? lastSnapshot.version + 1 : 1;

      const snapshot = await prisma.snapshot.create({
        data: {
          documentId,
          data,
          version,
        },
      });

      logger.info("快照创建成功", {
        documentId,
        snapshotId: snapshot.id,
        version,
      });

      return snapshot;
    } catch (error) {
      logger.error("快照创建失败", {
        error: error instanceof Error ? error.message : "Unknown error",
        documentId,
      });
      throw error;
    }
  }

  async findAll(documentId: string, page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;

    const [snapshots, total] = await Promise.all([
      prisma.snapshot.findMany({
        where: { documentId },
        orderBy: { version: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.snapshot.count({ where: { documentId } }),
    ]);

    return {
      list: snapshots,
      pagination: { total, page, pageSize },
    };
  }

  async findById(id: string) {
    return prisma.snapshot.findUnique({
      where: { id },
      include: {
        changesets: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async getLatest(documentId: string) {
    return prisma.snapshot.findFirst({
      where: { documentId },
      orderBy: { version: "desc" },
    });
  }

  async addChangeSet(documentId: string, userId: string, ops: any) {
    const latestSnapshot = await this.getLatest(documentId);

    if (!latestSnapshot) {
      throw new Error("文档快照不存在");
    }

    const changeSet = await prisma.changeSet.create({
      data: {
        documentId,
        snapshotId: latestSnapshot.id,
        userId,
        ops,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    logger.debug("变更集创建", {
      documentId,
      changeSetId: changeSet.id,
      userId,
      opsCount: Array.isArray(ops) ? ops.length : 0,
    });

    return changeSet;
  }

  async getChangeSets(documentId: string, page = 1, pageSize = 100) {
    const skip = (page - 1) * pageSize;

    const [changeSets, total] = await Promise.all([
      prisma.changeSet.findMany({
        where: { documentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.changeSet.count({ where: { documentId } }),
    ]);

    return {
      list: changeSets,
      pagination: { total, page, pageSize },
    };
  }

  async getChangeSetById(id: string) {
    return prisma.changeSet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }
}

export const snapshotService = new SnapshotService();
```

- [ ] **Step 2: 创建快照控制器**

```typescript
// src/controllers/snapshot.controller.ts
import { Request, Response } from "express";
import { snapshotService } from "../services/snapshot.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "../logger/index.js";

export class SnapshotController {
  async create(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { data } = req.body;

      if (!data) {
        throw new AppError(400, 1001, "快照数据不能为空");
      }

      const snapshot = await snapshotService.create(documentId, data);

      res.status(201).json({
        code: 0,
        data: snapshot,
        message: "快照创建成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;

      const result = await snapshotService.findAll(documentId, page, pageSize);

      res.json({
        code: 0,
        data: result,
        message: "获取快照列表成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { documentId, snapshotId } = req.params;
      const snapshot = await snapshotService.findById(snapshotId);

      if (!snapshot || snapshot.documentId !== documentId) {
        throw new AppError(404, 1004, "快照不存在");
      }

      res.json({
        code: 0,
        data: snapshot,
        message: "获取快照详情成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async addChangeSet(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const { ops } = req.body;
      const userId = (req as any).user?.id;

      if (!ops) {
        throw new AppError(400, 1001, "变更集数据不能为空");
      }

      if (!userId) {
        throw new AppError(401, 1002, "用户未认证");
      }

      const changeSet = await snapshotService.addChangeSet(
        documentId,
        userId,
        ops,
      );

      logger.info("变更集添加", {
        documentId,
        changeSetId: changeSet.id,
        userId,
      });

      res.status(201).json({
        code: 0,
        data: changeSet,
        message: "变更集添加成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async getChangeSets(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 100;

      const result = await snapshotService.getChangeSets(
        documentId,
        page,
        pageSize,
      );

      res.json({
        code: 0,
        data: result,
        message: "获取变更集列表成功",
      });
    } catch (error) {
      throw error;
    }
  }

  async getChangeSetById(req: Request, res: Response) {
    try {
      const { documentId, changesetId } = req.params;
      const changeSet = await snapshotService.getChangeSetById(changesetId);

      if (!changeSet || changeSet.documentId !== documentId) {
        throw new AppError(404, 1004, "变更集不存在");
      }

      res.json({
        code: 0,
        data: changeSet,
        message: "获取变更集详情成功",
      });
    } catch (error) {
      throw error;
    }
  }
}

export const snapshotController = new SnapshotController();
```

- [ ] **Step 3: 创建快照路由**

```typescript
// src/routes/snapshot.routes.ts
import { Router } from "express";
import { snapshotController } from "../controllers/snapshot.controller.js";
import {
  documentAccessMiddleware,
  documentOwnerMiddleware,
} from "../middleware/document-access.middleware.js";

const router = Router({ mergeParams: true });

router.use(documentAccessMiddleware);

router.post("/", (req, res, next) => snapshotController.create(req, res, next));
router.get("/", (req, res, next) => snapshotController.findAll(req, res, next));
router.get("/:snapshotId", (req, res, next) =>
  snapshotController.findById(req, res, next),
);
router.post("/changesets", (req, res, next) =>
  snapshotController.addChangeSet(req, res, next),
);

export default router;
```

- [ ] **Step 4: 创建变更集路由（独立的）**

```typescript
// src/routes/changeset.routes.ts
import { Router } from "express";
import { snapshotController } from "../controllers/snapshot.controller.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res, next) =>
  snapshotController.getChangeSets(req, res, next),
);
router.get("/:changesetId", (req, res, next) =>
  snapshotController.getChangeSetById(req, res, next),
);

export default router;
```

- [ ] **Step 5: 更新 app.ts**

```typescript
// 添加变更集路由
app.use(
  "/api/documents/:documentId/changesets",
  authMiddleware,
  documentAccessMiddleware,
  changesetRoutes,
);
```

- [ ] **Step 6: 提交代码**

```bash
git add src/services/snapshot.service.ts src/controllers/snapshot.controller.ts src/routes/snapshot.routes.ts src/routes/changeset.routes.ts
git commit -m "feat: implement snapshot and changeset management"
```

---

## 阶段五：WebSocket 协同编辑

### Task 9: 实现 WebSocket 协同服务

**Files:**

- Create: `server/src/websocket/index.ts`
- Create: `server/src/websocket/handler.ts`
- Create: `server/src/websocket/rooms.ts`

- [ ] **Step 1: 创建房间管理器**

```typescript
// src/websocket/rooms.ts
import { logger } from "../logger/index.js";

interface RoomUser {
  socketId: string;
  userId: string;
  username: string;
}

export class RoomManager {
  private rooms: Map<string, Map<string, RoomUser>> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private socketToUser: Map<string, RoomUser> = new Map();

  createRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
      logger.info("房间创建", { roomId });
    }
  }

  joinRoom(roomId: string, socketId: string, userId: string, username: string) {
    this.createRoom(roomId);

    const room = this.rooms.get(roomId)!;
    const user: RoomUser = { socketId, userId, username };

    room.set(socketId, user);
    this.socketToRoom.set(socketId, roomId);
    this.socketToUser.set(socketId, user);

    logger.info("用户加入房间", { roomId, userId, socketId });
  }

  leaveRoom(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      const user = room.get(socketId);
      room.delete(socketId);
      this.socketToRoom.delete(socketId);
      this.socketToUser.delete(socketId);

      logger.info("用户离开房间", { roomId, userId: user?.userId, socketId });

      if (room.size === 0) {
        this.rooms.delete(roomId);
        logger.info("房间已清空", { roomId });
      }
    }
  }

  getRoomUsers(roomId: string): RoomUser[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.values()) : [];
  }

  getRoomUserCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.size : 0;
  }

  getSocketRoom(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  getSocketUser(socketId: string): RoomUser | undefined {
    return this.socketToUser.get(socketId);
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
```

- [ ] **Step 2: 创建 WebSocket 处理器**

```typescript
// src/websocket/handler.ts
import { Server, Socket } from "socket.io";
import { roomManager } from "./rooms.js";
import { snapshotService } from "../services/snapshot.service.js";
import { documentService } from "../services/document.service.js";
import { verifyToken } from "../config/jwt.js";
import { logger } from "../logger/index.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export class CollaborationHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info("WebSocket 连接建立", { socketId: socket.id });

      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const decoded = verifyToken(token);
          socket.userId = decoded.sub;
          socket.username = decoded.name;
        }
      } catch (error) {
        logger.warn("WebSocket 认证失败", {
          socketId: socket.id,
          error: error instanceof Error ? error.message : "Invalid token",
        });
      }

      socket.on("join-document", (data) =>
        this.handleJoinDocument(socket, data),
      );
      socket.on("leave-document", (data) =>
        this.handleLeaveDocument(socket, data),
      );
      socket.on("changeset", (data) => this.handleChangeSet(socket, data));
      socket.on("sync-request", (data) => this.handleSyncRequest(socket, data));

      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  private async handleJoinDocument(
    socket: AuthenticatedSocket,
    data: { documentId: string },
  ) {
    const { documentId } = data;

    if (!socket.userId) {
      socket.emit("error", { code: 1002, message: "用户未认证" });
      return;
    }

    const document = await documentService.findById(documentId);
    if (!document) {
      socket.emit("error", { code: 1004, message: "文档不存在" });
      return;
    }

    roomManager.joinRoom(
      documentId,
      socket.id,
      socket.userId,
      socket.username || "Unknown",
    );

    socket.join(documentId);

    socket.emit("document-joined", {
      documentId,
      users: roomManager.getRoomUsers(documentId),
      latestSnapshot: document.snapshots[0],
    });

    socket.to(documentId).emit("user-joined", {
      userId: socket.userId,
      username: socket.username,
      userCount: roomManager.getRoomUserCount(documentId),
    });

    logger.info("用户加入文档协作", {
      documentId,
      userId: socket.userId,
      socketId: socket.id,
      userCount: roomManager.getRoomUserCount(documentId),
    });
  }

  private handleLeaveDocument(
    socket: AuthenticatedSocket,
    data: { documentId: string },
  ) {
    const { documentId } = data;
    const user = roomManager.getSocketUser(socket.id);

    socket.leave(documentId);
    roomManager.leaveRoom(socket.id);

    if (user) {
      socket.to(documentId).emit("user-left", {
        userId: user.userId,
        username: user.username,
        userCount: roomManager.getRoomUserCount(documentId),
      });

      logger.info("用户离开文档协作", {
        documentId,
        userId: user.userId,
        userCount: roomManager.getRoomUserCount(documentId),
      });
    }
  }

  private async handleChangeSet(socket: AuthenticatedSocket, data: any) {
    const { documentId, ops } = data;

    if (!socket.userId) {
      socket.emit("error", { code: 1002, message: "用户未认证" });
      return;
    }

    try {
      const changeSet = await snapshotService.addChangeSet(
        documentId,
        socket.userId,
        ops,
      );

      this.io.to(documentId).emit("changeset-sync", {
        userId: socket.userId,
        username: socket.username,
        ops,
        changeSetId: changeSet.id,
        timestamp: new Date().toISOString(),
      });

      logger.debug("变更集同步", {
        documentId,
        changeSetId: changeSet.id,
        userId: socket.userId,
        opsCount: Array.isArray(ops) ? ops.length : 0,
      });
    } catch (error) {
      logger.error("变更集同步失败", {
        documentId,
        error: error instanceof Error ? error.message : "Unknown error",
        userId: socket.userId,
      });

      socket.emit("error", {
        code: 2003,
        message: "变更集同步失败",
      });
    }
  }

  private async handleSyncRequest(socket: AuthenticatedSocket, data: any) {
    const { documentId, version } = data;

    try {
      const snapshots = await snapshotService.findAll(
        documentId,
        1,
        version ? version + 10 : 10,
      );

      socket.emit("sync-response", {
        documentId,
        snapshots: snapshots.list,
        currentVersion: snapshots.list[0]?.version || 0,
      });

      logger.debug("同步请求处理", {
        documentId,
        version,
        snapshotCount: snapshots.list.length,
      });
    } catch (error) {
      logger.error("同步请求失败", {
        documentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      socket.emit("error", {
        code: 2002,
        message: "同步请求失败",
      });
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const roomId = roomManager.getSocketRoom(socket.id);
    const user = roomManager.getSocketUser(socket.id);

    if (roomId && user) {
      socket.to(roomId).emit("user-left", {
        userId: user.userId,
        username: user.username,
        userCount: roomManager.getRoomUserCount(roomId),
      });
    }

    roomManager.leaveRoom(socket.id);

    logger.info("WebSocket 连接断开", {
      socketId: socket.id,
      userId: user?.userId,
      roomId,
    });
  }
}
```

- [ ] **Step 3: 创建 WebSocket 初始化模块**

```typescript
// src/websocket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { CollaborationHandler } from "./handler.js";
import { logger } from "../logger/index.js";

let io: SocketIOServer;
let collaborationHandler: CollaborationHandler;

export const initializeWebSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  collaborationHandler = new CollaborationHandler(io);

  logger.info("WebSocket 服务已初始化", {
    corsOrigin: process.env.CORS_ORIGIN,
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("WebSocket 未初始化");
  }
  return io;
};
```

- [ ] **Step 4: 提交代码**

```bash
git add src/websocket/
git commit -m "feat: implement WebSocket collaboration service with room management"
```

---

## 阶段六：前端核心功能

### Task 10: 实现前端 API 服务层

**Files:**

- Create: `client/src/services/api/axios.ts`
- Create: `client/src/services/api/document.service.ts`
- Create: `client/src/services/api/user.service.ts`

- [ ] **Step 1: 创建 Axios 实例**

```typescript
// client/src/services/api/axios.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data;

    if (code !== 0) {
      console.error(`API Error [${code}]:`, message);
      return Promise.reject(new Error(message));
    }

    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`HTTP Error [${status}]:`, data.message || "Unknown error");

      if (status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
```

- [ ] **Step 2: 创建文档服务**

```typescript
// client/src/services/api/document.service.ts
import axiosInstance from "./axios";

export interface Document {
  id: string;
  title: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  snapshots?: Snapshot[];
  members?: DocumentMember[];
}

export interface Snapshot {
  id: string;
  documentId: string;
  data: any;
  version: number;
  createdAt: string;
}

export interface DocumentMember {
  id: string;
  userId: string;
  role: "viewer" | "editor" | "owner";
  user: {
    id: string;
    username: string;
  };
}

export const documentService = {
  getDocuments(page = 1, pageSize = 20) {
    return axiosInstance.get("/documents", {
      params: { page, pageSize },
    });
  },

  getDocument(id: string) {
    return axiosInstance.get(`/documents/${id}`);
  },

  createDocument(title: string) {
    return axiosInstance.post("/documents", { title });
  },

  updateDocument(id: string, title: string) {
    return axiosInstance.put(`/documents/${id}`, { title });
  },

  deleteDocument(id: string) {
    return axiosInstance.delete(`/documents/${id}`);
  },

  shareDocument(id: string, userId: string, role: string) {
    return axiosInstance.post(`/documents/${id}/share`, { userId, role });
  },

  getDocumentMembers(id: string) {
    return axiosInstance.get(`/documents/${id}/members`);
  },

  removeMember(documentId: string, userId: string) {
    return axiosInstance.delete(`/documents/${documentId}/members/${userId}`);
  },

  getSnapshots(documentId: string, page = 1, pageSize = 50) {
    return axiosInstance.get(`/documents/${documentId}/snapshots`, {
      params: { page, pageSize },
    });
  },

  createSnapshot(documentId: string, data: any) {
    return axiosInstance.post(`/documents/${documentId}/snapshots`, { data });
  },

  getChangeSets(documentId: string, page = 1, pageSize = 100) {
    return axiosInstance.get(`/documents/${documentId}/changesets`, {
      params: { page, pageSize },
    });
  },
};
```

- [ ] **Step 3: 创建用户服务**

```typescript
// client/src/services/api/user.service.ts
import axiosInstance from "./axios";

export const userService = {
  getCurrentUser() {
    return axiosInstance.get("/users/me");
  },

  getUser(id: string) {
    return axiosInstance.get(`/users/${id}`);
  },
};
```

- [ ] **Step 4: 提交代码**

```bash
git add client/src/services/api/
git commit -m "feat: implement API service layer with Axios"
```

---

### Task 11: 实现前端状态管理

**Files:**

- Create: `client/src/stores/AuthContext.tsx`
- Create: `client/src/stores/DocumentContext.tsx`
- Create: `client/src/stores/useAuth.ts`
- Create: `client/src/stores/useDocument.ts`

- [ ] **Step 1: 创建认证上下文**

```typescript
// client/src/stores/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '../services/api/user.service'

interface User {
  id: string
  username: string
  email?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')

      if (savedToken) {
        try {
          const response = await userService.getCurrentUser()
          setUser(response.data)
          setToken(savedToken)
        } catch (error) {
          localStorage.removeItem('token')
          setUser(null)
          setToken(null)
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const setAuth = (newUser: User, newToken: string) => {
    localStorage.setItem('token', newToken)
    setUser(newUser)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: 创建文档上下文**

```typescript
// client/src/stores/DocumentContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react'
import { documentService, Document, Snapshot } from '../services/api/document.service'

interface DocumentContextType {
  document: Document | null
  snapshots: Snapshot[]
  loading: boolean
  error: string | null
  loadDocument: (id: string) => Promise<void>
  updateDocument: (title: string) => Promise<void>
  createSnapshot: (data: any) => Promise<void>
  clearDocument: () => void
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [document, setDocument] = useState<Document | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocument = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await documentService.getDocument(id)
      setDocument(response.data)

      const snapshotsResponse = await documentService.getSnapshots(id)
      setSnapshots(snapshotsResponse.data.list)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文档失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocument = useCallback(async (title: string) => {
    if (!document) return

    try {
      await documentService.updateDocument(document.id, title)
      setDocument({ ...document, title })
    } catch (err) {
      throw err
    }
  }, [document])

  const createSnapshot = useCallback(async (data: any) => {
    if (!document) return

    try {
      const response = await documentService.createSnapshot(document.id, data)
      setSnapshots([response.data, ...snapshots])
    } catch (err) {
      throw err
    }
  }, [document, snapshots])

  const clearDocument = useCallback(() => {
    setDocument(null)
    setSnapshots([])
    setError(null)
  }, [])

  return (
    <DocumentContext.Provider
      value={{
        document,
        snapshots,
        loading,
        error,
        loadDocument,
        updateDocument,
        createSnapshot,
        clearDocument,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export const useDocument = () => {
  const context = useContext(DocumentContext)
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider')
  }
  return context
}
```

- [ ] **Step 3: 提交代码**

```bash
git add client/src/stores/
git commit -m "feat: implement React Context for auth and document state management"
```

---

### Task 12: 实现前端电子表格组件和 WebSocket Hook

**Files:**

- Create: `client/src/components/spreadsheet/SpreadsheetEditor.tsx`
- Create: `client/src/hooks/useWebSocket.ts`
- Create: `client/src/hooks/useCollaboration.ts`

- [ ] **Step 1: 创建 WebSocket Hook**

```typescript
// client/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../stores/AuthContext";

interface CollaborationMessage {
  type: string;
  payload: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
  onMessage: (type: string, callback: (payload: any) => void) => void;
  offMessage: (type: string) => void;
}

export const useWebSocket = (documentId: string | null): UseWebSocketReturn => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(payload: any) => void>>>(
    new Map(),
  );

  useEffect(() => {
    if (!documentId || !token) return;

    socketRef.current = io(
      import.meta.env.VITE_WS_URL || "http://localhost:3000",
      {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      },
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-document", { documentId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    });

    Object.entries(listenersRef.current).forEach(([type, callbacks]) => {
      callbacks.forEach((callback) => {
        socket.on(type, (payload) => callback(payload));
      });
    });

    return () => {
      socket.emit("leave-document", { documentId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [documentId, token]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(type, payload);
    }
  }, []);

  const onMessage = useCallback(
    (type: string, callback: (payload: any) => void) => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      listenersRef.current.get(type)!.add(callback);

      if (socketRef.current) {
        socketRef.current.on(type, callback);
      }
    },
    [],
  );

  const offMessage = useCallback((type: string) => {
    const callbacks = listenersRef.current.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        if (socketRef.current) {
          socketRef.current.off(type, callback);
        }
      });
      listenersRef.current.delete(type);
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    onMessage,
    offMessage,
  };
};
```

- [ ] **Step 2: 创建协同编辑 Hook**

```typescript
// client/src/hooks/useCollaboration.ts
import { useEffect, useCallback, useState } from "react";
import { useWebSocket } from "./useWebSocket";

interface User {
  userId: string;
  username: string;
}

interface UseCollaborationReturn {
  users: User[];
  isConnected: boolean;
  latestSnapshot: any;
  applyChange: (ops: any[]) => void;
}

export const useCollaboration = (
  documentId: string | null,
  onSnapshotUpdate?: (snapshot: any) => void,
): UseCollaborationReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<any>(null);
  const { isConnected, sendMessage, onMessage, offMessage } =
    useWebSocket(documentId);

  useEffect(() => {
    if (!documentId) return;

    onMessage("document-joined", (payload) => {
      setUsers(payload.users || []);
      if (payload.latestSnapshot) {
        setLatestSnapshot(payload.latestSnapshot);
        onSnapshotUpdate?.(payload.latestSnapshot);
      }
    });

    onMessage("user-joined", (payload) => {
      setUsers((prev) => [...prev, payload]);
    });

    onMessage("user-left", (payload) => {
      setUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    });

    onMessage("snapshot-update", (payload) => {
      setLatestSnapshot(payload.snapshot);
      onSnapshotUpdate?.(payload.snapshot);
    });

    return () => {
      offMessage("document-joined");
      offMessage("user-joined");
      offMessage("user-left");
      offMessage("snapshot-update");
    };
  }, [documentId, onMessage, offMessage, onSnapshotUpdate]);

  const applyChange = useCallback(
    (ops: any[]) => {
      if (documentId) {
        sendMessage("changeset", { documentId, ops });
      }
    },
    [documentId, sendMessage],
  );

  return {
    users,
    isConnected,
    latestSnapshot,
    applyChange,
  };
};
```

- [ ] **Step 3: 创建电子表格编辑器组件**

```typescript
// client/src/components/spreadsheet/SpreadsheetEditor.tsx
import React, { useRef, useEffect, useCallback } from 'react'
import GC from '@grapecity/spread-sheets'
import { useCollaboration } from '../../hooks/useCollaboration'

interface SpreadsheetEditorProps {
  documentId: string
  initialData?: any
  onDataChange?: (data: any) => void
  readOnly?: boolean
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  documentId,
  initialData,
  onDataChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null)
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSnapshotUpdate = useCallback(
    (snapshot: any) => {
      if (snapshot?.data && spreadRef.current) {
        loadSnapshot(spreadRef.current, snapshot.data)
      }
    },
    []
  )

  const { users, isConnected, applyChange } = useCollaboration(documentId, handleSnapshotUpdate)

  useEffect(() => {
    if (!containerRef.current) return

    spreadRef.current = new GC.Spread.Sheets.Workbook(containerRef.current, {
      sheetCount: 1,
    })

    const sheet = spreadRef.current.getActiveSheet()

    sheet.setValue(0, 0, '产品名称')
    sheet.setValue(0, 1, '数量')
    sheet.setValue(0, 2, '单价')
    sheet.setValue(0, 3, '总计')

    if (initialData) {
      loadSnapshot(spreadRef.current, initialData)
    }

    if (!readOnly) {
      sheet.bind(GC.Spread.Sheets.Events.CellChanged, handleCellChange)
    }

    return () => {
      if (spreadRef.current) {
        spreadRef.current.getActiveSheet().unbind(GC.Spread.Sheets.Events.CellChanged)
        spreadRef.current.destroy()
      }
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }
    }
  }, [documentId, initialData, readOnly])

  const handleCellChange = useCallback(
    (sender: any, args: any) => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current)
      }

      changeTimeoutRef.current = setTimeout(() => {
        const snapshot = captureSnapshot()
        applyChange([{ type: 'cellChange', ...args }])
        onDataChange?.(snapshot)
      }, 100)
    },
    [applyChange, onDataChange]
  )

  const captureSnapshot = useCallback(() => {
    if (!spreadRef.current) return null

    const sheet = spreadRef.current.getActiveSheet()
    const snapshot = {
      data: [] as any[],
      formulas: {} as Record<string, string>,
      rowCount: sheet.getRowCount(),
      columnCount: sheet.getColumnCount(),
    }

    for (let row = 0; row < sheet.getRowCount(); row++) {
      for (let col = 0; col < sheet.getColumnCount(); col++) {
        const value = sheet.getValue(row, col)
        const formula = sheet.getFormula(row, col)

        if (value !== null && value !== undefined && value !== '') {
          snapshot.data.push({ row, col, value })
        }
        if (formula) {
          snapshot.formulas[`${row},${col}`] = formula
        }
      }
    }

    return snapshot
  }, [])

  const loadSnapshot = useCallback((spread: GC.Spread.Sheets.Workbook, snapshot: any) => {
    if (!snapshot) return

    const sheet = spread.getActiveSheet()

    sheet.suspendPaint()

    if (snapshot.rowCount) sheet.setRowCount(snapshot.rowCount)
    if (snapshot.columnCount) sheet.setColumnCount(snapshot.columnCount)

    if (snapshot.data) {
      snapshot.data.forEach((cell: any) => {
        sheet.setValue(cell.row, cell.col, cell.value)
      })
    }

    if (snapshot.formulas) {
      Object.entries(snapshot.formulas).forEach(([key, formula]) => {
        const [row, col] = key.split(',').map(Number)
        sheet.setFormula(row, col, formula as string)
      })
    }

    sheet.resumePaint()
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
      {!isConnected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
          }}
        >
          正在连接协同服务器...
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 提交代码**

```bash
git add client/src/components/spreadsheet/ client/src/hooks/
git commit -m "feat: implement SpreadsheetEditor component with WebSocket collaboration"
```

---

### Task 13: 实现前端页面

**Files:**

- Create: `client/src/pages/DocumentList/index.tsx`
- Create: `client/src/pages/DocumentEdit/index.tsx`

- [ ] **Step 1: 创建文档列表页**

```typescript
// client/src/pages/DocumentList/index.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Card, Input, Modal, message } from 'antd'
import { PlusOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons'
import { documentService, Document } from '../../services/api/document.service'
import { useAuth } from '../../stores/AuthContext'

const { Search } = Input

export default function DocumentListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const loadDocuments = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const response = await documentService.getDocuments(page, pageSize)
      setDocuments(response.data.list)
      setPagination({
        ...pagination,
        current: page,
        pageSize,
        total: response.data.pagination.total,
      })
    } catch (error) {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      message.warning('请输入文档标题')
      return
    }

    try {
      const response = await documentService.createDocument(newTitle)
      message.success('文档创建成功')
      setCreateModalVisible(false)
      setNewTitle('')
      navigate(`/documents/${response.data.id}`)
    } catch (error) {
      message.error('创建文档失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await documentService.deleteDocument(id)
          message.success('文档已删除')
          loadDocuments(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('删除文档失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Document) => (
        <a onClick={() => navigate(`/documents/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Document) => (
        <Space>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            danger
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>我的文档</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建文档
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadDocuments(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="新建文档"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false)
          setNewTitle('')
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文档标题"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 创建文档编辑页**

```typescript
// client/src/pages/DocumentEdit/index.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Card, Input, Breadcrumb, message, Modal, Table } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, HistoryOutlined, TeamOutlined } from '@ant-design/icons'
import { SpreadsheetEditor } from '../../components/spreadsheet/SpreadsheetEditor'
import { useDocument, DocumentProvider } from '../../stores/DocumentContext'
import { documentService } from '../../services/api/document.service'

const DocumentEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { document, snapshots, loadDocument, updateDocument, createSnapshot } = useDocument()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [historyVisible, setHistoryVisible] = useState(false)

  useEffect(() => {
    if (id) {
      loadDocument(id)
    }
  }, [id, loadDocument])

  useEffect(() => {
    if (document) {
      setTitle(document.title)
    }
  }, [document])

  const handleSave = async () => {
    if (!id || !title.trim()) return

    try {
      await updateDocument(title)
      message.success('文档保存成功')
      setEditing(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCreateSnapshot = async () => {
    if (!id) return

    Modal.confirm({
      title: '创建快照',
      content: '确定要创建当前文档的快照吗？',
      onOk: async () => {
        try {
          const spreadsheetEl = document.querySelector('#ss')
          if (spreadsheetEl) {
            const data = captureCurrentData()
            await createSnapshot(data)
            message.success('快照创建成功')
            loadDocument(id)
          }
        } catch (error) {
          message.error('快照创建失败')
        }
      },
    })
  }

  const captureCurrentData = () => {
    return {
      data: [],
      formulas: {},
      rowCount: 100,
      columnCount: 26,
    }
  }

  const historyColumns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ]

  if (!document) {
    return <div>加载中...</div>
  }

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')} />
            {editing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: 300 }}
                autoFocus
                onPressEnter={handleSave}
              />
            ) : (
              <span onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
                {document.title}
              </span>
            )}
          </Space>
        }
        extra={
          <Space>
            {editing && (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
            )}
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
              历史版本
            </Button>
            <Button icon={<SaveOutlined />} onClick={handleCreateSnapshot}>
              创建快照
            </Button>
          </Space>
        }
      >
        <SpreadsheetEditor documentId={id!} />
      </Card>

      <Modal
        title="历史版本"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={600}
      >
        <Table
          columns={historyColumns}
          dataSource={snapshots}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  )
}

export default function DocumentEditPage() {
  return (
    <DocumentProvider>
      <DocumentEditContent />
    </DocumentProvider>
  )
}
```

- [ ] **Step 3: 更新 App.tsx 添加页面路由**

```typescript
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocumentListPage from './pages/DocumentList'
import DocumentEditPage from './pages/DocumentEdit'
import { AuthProvider } from './stores/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/:id" element={<DocumentEditPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
```

- [ ] **Step 4: 提交代码**

```bash
git add client/src/pages/ client/src/App.tsx
git commit -m "feat: implement DocumentList and DocumentEdit pages"
```

---

## 阶段七：集成测试和配置

### Task 14: 创建环境配置文件

**Files:**

- Create: `client/.env`
- Create: `server/.env`
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建前端环境文件**

```env
# client/.env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

- [ ] **Step 2: 创建后端环境文件**

```env
# server/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://spreadjs:spreadjs123@localhost:3306/spreadjs
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:5173
LOG_DIR=./logs
LOG_MAX_FILES=180d
```

- [ ] **Step 3: 创建 Docker Compose 配置**

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    container_name: spreadjs-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: spreadjs
      MYSQL_USER: spreadjs
      MYSQL_PASSWORD: spreadjs123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/prisma/migrations:/docker-entrypoint-initdb.d
    command: --default-authentication-plugin=mysql_native_password

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: spreadjs-server
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://spreadjs:spreadjs123@mysql:3306/spreadjs
      JWT_SECRET: your-super-secret-jwt-key
      CORS_ORIGIN: http://localhost:5173
    depends_on:
      - mysql
    volumes:
      - ./server/logs:/app/logs

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: spreadjs-client
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

- [ ] **Step 4: 创建根目录 package.json（monorepo）**

```json
{
  "name": "spreadjs-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "npm run dev:server & npm run dev:client",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "npm run build:server && npm run build:client",
    "build:server": "cd server && npm run build",
    "build:client": "cd client && npm run build",
    "db:migrate": "cd server && npm run db:migrate",
    "lint": "npm run lint:server && npm run lint:client",
    "lint:server": "cd server && npm run lint",
    "lint:client": "cd client && npm run lint"
  }
}
```

- [ ] **Step 5: 提交代码**

```bash
git add .env docker-compose.yml package.json
git commit -m "feat: add environment configuration and Docker Compose setup"
```

---

### Task 15: 创建 README 文档

**Files:**

- Create: `README.md`

- [ ] **Step 1: 创建项目 README**

```markdown
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
├── client/ # 前端项目
├── server/ # 后端项目
├── docker-compose.yml
└── README.md

````

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
````

### 2. 配置数据库

```bash
# 启动 MySQL (Docker)
docker-compose up -d mysql

# 运行数据库迁移
cd server
npm run db:push
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 或分别启动
npm run dev:server  # 后端
npm run dev:client  # 前端
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

### 测试

```bash
# 后端测试
cd server
npm test

# 前端测试
cd client
npm test
```

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 环境变量

详细配置请参考 `.env.example` 文件。

## 日志

日志文件位于 `server/logs/` 目录，按日期自动轮转，保留 180 天。

- `application-YYYY-MM-DD.log` - 应用日志
- `error-YYYY-MM-DD.log` - 错误日志
- `ws-YYYY-MM-DD.log` - WebSocket 日志

## License

MIT

````

- [ ] **Step 2: 提交代码**

```bash
git add README.md
git commit -m "docs: add comprehensive README documentation"
````

---

## 验收清单

- [ ] Task 1: 前端项目结构创建完成
- [ ] Task 2: 后端项目结构创建完成
- [ ] Task 3: 数据库 Schema 设计完成
- [ ] Task 4: 日志系统实现完成
- [ ] Task 5: JWT 认证中间件实现完成
- [ ] Task 6: 用户管理功能实现完成
- [ ] Task 7: 文档 CRUD 功能实现完成
- [ ] Task 8: 快照和变更集管理实现完成
- [ ] Task 9: WebSocket 协同服务实现完成
- [ ] Task 10: 前端 API 服务层实现完成
- [ ] Task 11: 前端状态管理实现完成
- [ ] Task 12: 电子表格组件实现完成
- [ ] Task 13: 前端页面实现完成
- [ ] Task 14: 环境配置完成
- [ ] Task 15: 文档完成

---

## 总结

本实现计划包含 15 个核心任务，覆盖了从项目初始化、数据库设计、日志系统、认证授权、文档管理、协同编辑到前端实现的完整流程。每个任务都包含详细的代码示例和文件路径，确保实现过程清晰、可追踪。

**下一步：** 开始执行实现计划！
