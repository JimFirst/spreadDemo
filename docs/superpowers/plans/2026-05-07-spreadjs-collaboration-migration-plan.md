# SpreadJS 协同服务器迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SpreadJS 协同功能从自定义 socket.io 实现迁移到官方 @grapecity-software 协同库，同时保留 MySQL 数据库集成和 JWT 认证系统

**Architecture:** 使用官方协同服务器 (js-collaboration + js-collaboration-ot) 替代 socket.io，通过 bind() 函数实现自动同步和 OT 冲突解决，保留现有 MySQL 数据库架构实现 Database Adapter

**Tech Stack:** 
- 服务端: @grapecity-software/js-collaboration, @grapecity-software/js-collaboration-ot, express, MySQL/Prisma
- 客户端: @grapecity-software/js-collaboration-client, @grapecity-software/js-collaboration-ot-client, @grapecity-software/spread-sheets-collaboration-client, React

---

## 第一阶段：服务端迁移

### Task 1: 安装服务端依赖

**Files:**
- Modify: `server/package.json`
- Modify: `server/.env.example`

- [ ] **Step 1: 更新 package.json 添加官方协同库依赖**

```json
{
  "dependencies": {
    "@grapecity-software/js-collaboration": "^1.0.0",
    "@grapecity-software/js-collaboration-ot": "^1.0.0",
    "@grapecity-software/spread-sheets-collaboration": "^18.2.5",
    "@prisma/client": "^5.6.0",
    "express": "^4.18.2"
  }
}
```

- [ ] **Step 2: 更新 .env.example 添加协同服务器配置**

```env
COLLABORATION_PORT=8080
COLLABORATION_CORS_ORIGIN=http://localhost:5173
COLLABORATION_JWT_SECRET=your-secret-key
```

- [ ] **Step 3: 安装新依赖**

Run: `cd server && npm install @grapecity-software/js-collaboration @grapecity-software/js-collaboration-ot @grapecity-software/spread-sheets-collaboration`

- [ ] **Step 4: 提交变更**

```bash
git add server/package.json server/.env.example
git commit -m "feat(server): add official collaboration server dependencies"
```

---

### Task 2: 创建协同服务器目录结构

**Files:**
- Create: `server/src/collaboration/index.ts`
- Create: `server/src/collaboration/mysql-adapter.ts`
- Create: `server/src/collaboration/types.ts`

- [ ] **Step 1: 创建 collaboration 目录**

Run: `mkdir -p server/src/collaboration`

- [ ] **Step 2: 创建类型定义文件 (collaboration/types.ts)**

```typescript
import { PrismaClient } from '@prisma/client';

export interface Document {
  id: string;
  type: string;
  snapshot: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Snapshot {
  id: number;
  docId: string;
  version: number;
  data: string;
  createdAt: Date;
}

export interface Operation {
  id: number;
  docId: string;
  version: number;
  operations: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Permission {
  id: number;
  docId: string;
  userId: string;
  permissions: string[];
  createdAt: Date;
}

export interface DatabaseAdapter {
  createDocument(docId: string, snapshot: any, type: string, meta?: any): Promise<void>;
  getDocument(docId: string): Promise<Document | null>;
  updateSnapshot(docId: string, version: number, snapshot: any): Promise<void>;
  getSnapshotHistory(docId: string, offset: number, limit: number): Promise<Snapshot[]>;
  createOperation(docId: string, version: number, ops: any[]): Promise<void>;
  getOperations(docId: string, version: number): Promise<Operation[]>;
  addUser(userId: string, username: string): Promise<void>;
  getUser(userId: string): Promise<User | null>;
  checkPermission(userId: string, docId: string, action: string): Promise<boolean>;
  grantPermission(userId: string, docId: string, permissions: string[]): Promise<void>;
}
```

- [ ] **Step 3: 提交类型定义**

```bash
git add server/src/collaboration/types.ts
git commit -m "feat(server): add collaboration types definition"
```

---

### Task 3: 实现 MySQL Database Adapter

**Files:**
- Create: `server/src/collaboration/mysql-adapter.ts`
- Test: `server/src/collaboration/__tests__/mysql-adapter.test.ts`

- [ ] **Step 1: 创建 mysql-adapter.ts 实现文件**

```typescript
import { PrismaClient, Document as PrismaDocument, Prisma } from '@prisma/client';
import { DatabaseAdapter, Document, Snapshot, Operation, User } from './types';

export class MySQLAdapter implements DatabaseAdapter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createDocument(docId: string, snapshot: any, type: string, meta?: any): Promise<void> {
    await this.prisma.document.upsert({
      where: { id: docId },
      update: {
        snapshot: JSON.stringify(snapshot),
        version: 0,
        type,
      },
      create: {
        id: docId,
        snapshot: JSON.stringify(snapshot),
        version: 0,
        type,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  }

  async getDocument(docId: string): Promise<Document | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    
    if (!doc) return null;
    
    return {
      id: doc.id,
      type: doc.type,
      snapshot: doc.snapshot,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async updateSnapshot(docId: string, version: number, snapshot: any): Promise<void> {
    await this.prisma.document.update({
      where: { id: docId },
      data: {
        snapshot: JSON.stringify(snapshot),
        version,
        updatedAt: new Date(),
      },
    });
  }

  async getSnapshotHistory(docId: string, offset: number, limit: number): Promise<Snapshot[]> {
    const snapshots = await this.prisma.snapshot.findMany({
      where: { docId },
      orderBy: { version: 'desc' },
      skip: offset,
      take: limit,
    });

    return snapshots.map(s => ({
      id: s.id,
      docId: s.docId,
      version: s.version,
      data: s.data,
      createdAt: s.createdAt,
    }));
  }

  async createOperation(docId: string, version: number, ops: any[]): Promise<void> {
    await this.prisma.snapshot.create({
      data: {
        docId,
        version,
        data: JSON.stringify(ops),
      },
    });

    await this.prisma.document.update({
      where: { id: docId },
      data: {
        version,
      },
    });
  }

  async getOperations(docId: string, version: number): Promise<Operation[]> {
    const snapshots = await this.prisma.snapshot.findMany({
      where: {
        docId,
        version: { gt: version },
      },
      orderBy: { version: 'asc' },
    });

    return snapshots.map(s => ({
      id: s.id,
      docId: s.docId,
      version: s.version,
      operations: s.data,
      createdAt: s.createdAt,
    }));
  }

  async addUser(userId: string, username: string): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: userId },
      update: { name: username },
      create: {
        id: userId,
        name: username,
      },
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
    };
  }

  async checkPermission(userId: string, docId: string, action: string): Promise<boolean> {
    const permission = await this.prisma.permission.findUnique({
      where: {
        docId_userId: {
          docId,
          userId,
        },
      },
    });

    if (!permission) {
      return action === 'read';
    }

    const permissions = JSON.parse(permission.permissions) as string[];
    return permissions.includes(action);
  }

  async grantPermission(userId: string, docId: string, permissions: string[]): Promise<void> {
    await this.prisma.permission.upsert({
      where: {
        docId_userId: {
          docId,
          userId,
        },
      },
      update: {
        permissions: JSON.stringify(permissions),
      },
      create: {
        docId,
        userId,
        permissions: JSON.stringify(permissions),
      },
    });
  }
}
```

- [ ] **Step 2: 创建单元测试目录和测试文件**

Run: `mkdir -p server/src/collaboration/__tests__`

- [ ] **Step 3: 编写 MySQL Adapter 单元测试**

```typescript
import { MySQLAdapter } from '../mysql-adapter';
import { PrismaClient } from '@prisma/client';

describe('MySQLAdapter', () => {
  let adapter: MySQLAdapter;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    adapter = new MySQLAdapter(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('createDocument', () => {
    it('should create a new document', async () => {
      const docId = 'test-doc-' + Date.now();
      const snapshot = { data: 'test' };
      const type = 'gc.spread.sheets';

      await adapter.createDocument(docId, snapshot, type);

      const doc = await adapter.getDocument(docId);
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe(docId);
      expect(doc!.type).toBe(type);
      expect(JSON.parse(doc!.snapshot!)).toEqual(snapshot);
      expect(doc!.version).toBe(0);
    });

    it('should update existing document', async () => {
      const docId = 'test-doc-update-' + Date.now();
      const snapshot1 = { data: 'test1' };
      const snapshot2 = { data: 'test2' };

      await adapter.createDocument(docId, snapshot1, 'type1');
      await adapter.createDocument(docId, snapshot2, 'type2');

      const doc = await adapter.getDocument(docId);
      expect(JSON.parse(doc!.snapshot!)).toEqual(snapshot2);
    });
  });

  describe('addUser and getUser', () => {
    it('should add and retrieve user', async () => {
      const userId = 'user-' + Date.now();
      const username = 'Test User';

      await adapter.addUser(userId, username);
      const user = await adapter.getUser(userId);

      expect(user).not.toBeNull();
      expect(user!.id).toBe(userId);
      expect(user!.name).toBe(username);
    });

    it('should return null for non-existent user', async () => {
      const user = await adapter.getUser('non-existent-user');
      expect(user).toBeNull();
    });
  });
});
```

- [ ] **Step 4: 运行测试验证**

Run: `cd server && npm test -- src/collaboration/__tests__/mysql-adapter.test.ts`
Expected: 测试通过

- [ ] **Step 5: 提交 MySQL Adapter 实现和测试**

```bash
git add server/src/collaboration/mysql-adapter.ts server/src/collaboration/__tests__/mysql-adapter.test.ts
git commit -m "feat(server): implement MySQL Database Adapter for collaboration"
```

---

### Task 4: 创建协同服务器入口文件

**Files:**
- Create: `server/src/collaboration/index.ts`
- Modify: `server/src/server.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: 创建协同服务器初始化文件 (collaboration/index.ts)**

```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as CollaborationServer } from '@grapecity-software/js-collaboration';
import * as OT from '@grapecity-software/js-collaboration-ot';
import { type } from '@grapecity-software/spread-sheets-collaboration';
import { MySQLAdapter } from './mysql-adapter';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../config/jwt';
import { logger } from '../logger/index';

OT.TypesManager.register(type);

export class CollaborationServerManager {
  private server: CollaborationServer;
  private app: Express;
  private httpServer: http.Server;
  private prisma: PrismaClient;
  private dbAdapter: MySQLAdapter;
  private documentServices: OT.DocumentServices;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.prisma = new PrismaClient();
    this.dbAdapter = new MySQLAdapter(this.prisma);
    this.documentServices = new OT.DocumentServices(this.dbAdapter);
    
    this.server = new CollaborationServer({
      httpServer: this.httpServer,
    });
  }

  async initialize(port: number, corsOrigin: string): Promise<void> {
    this.app.use(cors({
      origin: corsOrigin,
      credentials: true,
    }));

    this.app.use(express.json());

    this.server.useAuth((req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权' });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        (req as any).userId = decoded.sub;
        (req as any).username = decoded.name;
        next();
      } catch (error) {
        res.status(401).json({ error: '认证失败' });
      }
    });

    this.server.useFeature(OT.documentFeature(this.documentServices));

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.httpServer.listen(port, () => {
      logger.info(`协同服务器运行在端口 ${port}`, { corsOrigin });
    });

    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.httpServer.on('error', (error: Error) => {
      logger.error('协同服务器错误:', error);
    });

    process.on('uncaughtException', (error) => {
      logger.error('未捕获异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝:', { reason, promise });
    });
  }

  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
    this.httpServer.close();
  }
}

export const createCollaborationServer = async (): Promise<CollaborationServerManager> => {
  const manager = new CollaborationServerManager();
  await manager.initialize(
    parseInt(process.env.COLLABORATION_PORT || '8080'),
    process.env.COLLABORATION_CORS_ORIGIN || 'http://localhost:5173'
  );
  return manager;
};
```

- [ ] **Step 2: 修改 server.ts 集成协同服务器**

```typescript
import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeWebSocket } from './websocket';
import { createCollaborationServer } from './collaboration';
import { logger } from './logger/index';
import { corsConfig } from './config/cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors(corsConfig));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);

initializeWebSocket(httpServer);

createCollaborationServer()
  .then(() => {
    logger.info('协同服务器初始化完成');
  })
  .catch((error) => {
    logger.error('协同服务器初始化失败:', error);
  });

httpServer.listen(PORT, () => {
  logger.info(`HTTP 服务器运行在端口 ${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，开始关闭服务器');
  httpServer.close(() => {
    logger.info('HTTP 服务器已关闭');
    process.exit(0);
  });
});
```

- [ ] **Step 3: 提交协同服务器入口文件**

```bash
git add server/src/collaboration/index.ts server/src/server.ts
git commit -m "feat(server): add collaboration server initialization"
```

---

### Task 5: 删除旧的 socket.io WebSocket 实现

**Files:**
- Delete: `server/src/websocket/index.ts`
- Delete: `server/src/websocket/handler.ts`
- Delete: `server/src/websocket/rooms.ts`

- [ ] **Step 1: 删除 websocket 目录**

Run: `rm -rf server/src/websocket`

- [ ] **Step 2: 从 server.ts 中移除旧的 WebSocket 初始化**

Run: `sed -i '' '/initializeWebSocket/d' server/src/server.ts`

- [ ] **Step 3: 提交删除旧代码**

```bash
git add server/src/server.ts
git rm -r server/src/websocket
git commit -m "refactor(server): remove old socket.io implementation"
```

---

## 第二阶段：客户端迁移

### Task 6: 安装客户端依赖

**Files:**
- Modify: `client/package.json`
- Modify: `client/.env.example`

- [ ] **Step 1: 更新 package.json 添加官方协同客户端库**

```json
{
  "dependencies": {
    "@grapecity-software/spread-sheets-collaboration-addon": "^18.2.5",
    "@grapecity-software/js-collaboration-client": "^1.0.0",
    "@grapecity-software/js-collaboration-ot-client": "^1.0.0",
    "@grapecity-software/spread-sheets-collaboration-client": "^1.0.0"
  }
}
```

- [ ] **Step 2: 创建或更新 .env.example**

```env
VITE_COLLABORATION_URL=http://localhost:8080
```

- [ ] **Step 3: 安装新依赖**

Run: `cd client && npm install @grapecity-software/spread-sheets-collaboration-addon @grapecity-software/js-collaboration-client @grapecity-software/js-collaboration-ot-client @grapecity-software/spread-sheets-collaboration-client`

- [ ] **Step 4: 提交依赖变更**

```bash
git add client/package.json client/.env.example
git commit -m "feat(client): add official collaboration client dependencies"
```

---

### Task 7: 创建 useSpreadCollaboration Hook

**Files:**
- Create: `client/src/hooks/useSpreadCollaboration.ts`
- Test: `client/src/hooks/__tests__/useSpreadCollaboration.test.ts`

- [ ] **Step 1: 创建 useSpreadCollaboration hook 实现**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@grapecity-software/js-collaboration-client';
import * as OT from '@grapecity-software/js-collaboration-ot-client';
import { type, bind } from '@grapecity-software/spread-sheets-collaboration-client';
import type GC from '@grapecity-software/spread-sheets';

interface User {
  userId: string;
  username: string;
}

interface UseSpreadCollaborationOptions {
  documentId: string;
  serverUrl: string;
  token?: string;
  autoConnect?: boolean;
}

interface UseSpreadCollaborationReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  users: User[];
  bindWorkbook: (workbook: GC.Spread.Sheets.Workbook) => void;
  disconnect: () => void;
}

export const useSpreadCollaboration = ({
  documentId,
  serverUrl,
  token,
  autoConnect = true,
}: UseSpreadCollaborationOptions): UseSpreadCollaborationReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const clientRef = useRef<Client | null>(null);
  const docRef = useRef<OT.SharedDoc | null>(null);
  const workbookRef = useRef<GC.Spread.Sheets.Workbook | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!autoConnect || !documentId || !serverUrl) {
      setIsLoading(false);
      return;
    }

    const initCollaboration = async () => {
      try {
        OT.TypesManager.register(type);

        const client = new Client();
        await client.connect(serverUrl);
        clientRef.current = client;

        const doc = new OT.SharedDoc(client);
        docRef.current = doc;

        doc.on('user-join', (user: User) => {
          setUsers((prev) => [...prev, user]);
        });

        doc.on('user-leave', (user: User) => {
          setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        });

        doc.on('error', (err: Error) => {
          setError(err);
          console.error('协同错误:', err);
        });

        doc.on('sync', async () => {
          if (!doc.type && workbookRef.current) {
            await doc.create(
              workbookRef.current.collaboration.toSnapshot(),
              type.uri,
              {}
            );
            if (workbookRef.current) {
              bind(workbookRef.current, doc);
            }
          } else if (doc.type && workbookRef.current) {
            bind(workbookRef.current, doc);
          }
        });

        await doc.fetch();

        if (!doc.type && !workbookRef.current) {
          const emptyDoc = new OT.SharedDoc(client);
          await emptyDoc.create({}, type.uri, {});
          doc.type = emptyDoc.type;
        }

        setIsConnected(true);
        setIsLoading(false);
        isInitializedRef.current = true;
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
        console.error('协同初始化失败:', err);
      }
    };

    initCollaboration();

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      if (docRef.current) {
        docRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [documentId, serverUrl, autoConnect]);

  const bindWorkbook = useCallback((workbook: GC.Spread.Sheets.Workbook) => {
    workbookRef.current = workbook;

    if (docRef.current) {
      if (!docRef.current.type) {
        docRef.current.once('sync', async () => {
          if (!docRef.current!.type && workbookRef.current) {
            await docRef.current!.create(
              workbookRef.current.collaboration.toSnapshot(),
              type.uri,
              {}
            );
            bind(workbookRef.current, docRef.current!);
          }
        });
      } else {
        bind(workbook, docRef.current);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (docRef.current) {
      docRef.current = null;
    }
    setIsConnected(false);
    setUsers([]);
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    users,
    bindWorkbook,
    disconnect,
  };
};
```

- [ ] **Step 2: 创建测试文件**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useSpreadCollaboration } from '../useSpreadCollaboration';

describe('useSpreadCollaboration', () => {
  it('should initialize with correct initial state', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: null,
        serverUrl: 'http://localhost:8080',
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.users).toEqual([]);
  });

  it('should not connect when documentId is null', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: null,
        serverUrl: 'http://localhost:8080',
        autoConnect: true,
      })
    );

    expect(result.current.isLoading).toBe(false);
  });

  it('should not connect when autoConnect is false', () => {
    const { result } = renderHook(() =>
      useSpreadCollaboration({
        documentId: 'test-doc',
        serverUrl: 'http://localhost:8080',
        autoConnect: false,
      })
    );

    expect(result.current.isLoading).toBe(false);
  });
});
```

- [ ] **Step 3: 提交 Hook 实现**

```bash
git add client/src/hooks/useSpreadCollaboration.ts client/src/hooks/__tests__/useSpreadCollaboration.test.ts
git commit -m "feat(client): create useSpreadCollaboration hook"
```

---

### Task 8: 重构 SpreadsheetEditor 组件

**Files:**
- Modify: `client/src/components/spreadsheet/SpreadsheetEditor.tsx`

- [ ] **Step 1: 重写 SpreadsheetEditor 组件**

```typescript
import React, { useRef, useEffect, useCallback } from 'react';
import GC from '@grapecity/spread-sheets';
import '@grapecity-software/spread-sheets-collaboration-addon';
import '@grapecity-software/spread-sheets/styles/gc.spread.sheets.excel2013white.css';
import { useSpreadCollaboration } from '../../hooks/useSpreadCollaboration';

interface SpreadsheetEditorProps {
  documentId: string;
  initialData?: any;
  onDataChange?: (data: any) => void;
  readOnly?: boolean;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  documentId,
  initialData,
  onDataChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null);

  const serverUrl = import.meta.env.VITE_COLLABORATION_URL || 'http://localhost:8080';

  const {
    isConnected,
    isLoading,
    error,
    bindWorkbook,
  } = useSpreadCollaboration({
    documentId,
    serverUrl,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const spread = new GC.Spread.Sheets.Workbook(
      containerRef.current,
      { sheetCount: 1 }
    );

    spreadRef.current = spread;

    if (!readOnly) {
      bindWorkbook(spread);
    }

    if (initialData) {
      loadSnapshot(initialData);
    }

    return () => {
      if (spreadRef.current) {
        spreadRef.current.destroy();
        spreadRef.current = null;
      }
    };
  }, [documentId, readOnly]);

  const loadSnapshot = useCallback((snapshot: any) => {
    if (!snapshot || !spreadRef.current) return;

    const sheet = spreadRef.current.getActiveSheet();
    sheet.suspendPaint();

    if (snapshot.rowCount) sheet.setRowCount(snapshot.rowCount);
    if (snapshot.columnCount) sheet.setColumnCount(snapshot.columnCount);

    if (snapshot.data) {
      snapshot.data.forEach((cell: any) => {
        sheet.setValue(cell.row, cell.col, cell.value);
      });
    }

    if (snapshot.formulas) {
      Object.entries(snapshot.formulas).forEach(([key, formula]) => {
        const [row, col] = key.split(',').map(Number);
        sheet.setFormula(row, col, formula as string);
      });
    }

    sheet.resumePaint();
  }, []);

  const loadingStyles: React.CSSProperties = {
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
    zIndex: 1000,
  };

  const errorStyles: React.CSSProperties = {
    ...loadingStyles,
    background: 'rgba(255,0,0,0.5)',
  };

  const overlayStyles: React.CSSProperties = {
    ...loadingStyles,
    background: 'rgba(0,0,0,0.3)',
  };

  if (isLoading) {
    return <div style={loadingStyles}>正在连接协同服务器...</div>;
  }

  if (error) {
    return (
      <div style={errorStyles}>
        连接失败: {error.message}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
      {!isConnected && (
        <div style={overlayStyles}>
          正在连接协同服务器...
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 提交组件重构**

```bash
git add client/src/components/spreadsheet/SpreadsheetEditor.tsx
git commit -m "refactor(client): rewrite SpreadsheetEditor to use official collaboration"
```

---

### Task 9: 删除旧的 socket.io hooks

**Files:**
- Delete: `client/src/hooks/useWebSocket.ts`
- Delete: `client/src/hooks/useCollaboration.ts`

- [ ] **Step 1: 删除旧 hooks**

Run: `rm client/src/hooks/useWebSocket.ts client/src/hooks/useCollaboration.ts`

- [ ] **Step 2: 提交删除**

```bash
git rm client/src/hooks/useWebSocket.ts client/src/hooks/useCollaboration.ts
git commit -m "refactor(client): remove old socket.io hooks"
```

---

## 第三阶段：集成测试与验证

### Task 10: 配置测试环境

**Files:**
- Create: `server/src/collaboration/__tests__/integration.test.ts`
- Create: `client/src/hooks/__tests__/useSpreadCollaboration.integration.test.tsx`

- [ ] **Step 1: 创建服务端集成测试**

```typescript
import { CollaborationServerManager } from '../index';
import { PrismaClient } from '@prisma/client';

describe('Collaboration Server Integration', () => {
  let server: CollaborationServerManager;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.COLLABORATION_PORT = '8081';
    process.env.COLLABORATION_CORS_ORIGIN = 'http://localhost:5173';
    
    server = await createCollaborationServer();
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await server.shutdown();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.document.deleteMany({});
    await prisma.snapshot.deleteMany({});
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await fetch('http://localhost:8081/health');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  describe('Document Operations', () => {
    it('should create and retrieve document', async () => {
      const docId = 'test-doc-' + Date.now();
      const snapshot = { data: 'test' };
      
      const adapter = new MySQLAdapter(prisma);
      await adapter.createDocument(docId, snapshot, 'gc.spread.sheets');
      
      const doc = await adapter.getDocument(docId);
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe(docId);
    });
  });
});
```

- [ ] **Step 2: 提交集成测试**

```bash
git add server/src/collaboration/__tests__/integration.test.ts
git commit -m "test(server): add collaboration server integration tests"
```

---

### Task 11: 运行完整测试套件

- [ ] **Step 1: 运行服务端测试**

Run: `cd server && npm test`
Expected: 所有测试通过

- [ ] **Step 2: 运行客户端类型检查**

Run: `cd client && npm run typecheck`
Expected: 无类型错误

- [ ] **Step 3: 构建客户端**

Run: `cd client && npm run build`
Expected: 构建成功

- [ ] **Step 4: 提交测试结果**

```bash
git commit -m "test: run full test suite and verify build"
```

---

## 第四阶段：数据迁移（可选）

### Task 12: 创建数据迁移脚本

**Files:**
- Create: `server/scripts/migrate-to-collaboration.ts`

- [ ] **Step 1: 创建迁移脚本**

```typescript
import { PrismaClient } from '@prisma/client';

async function migrateData() {
  const prisma = new PrismaClient();

  try {
    console.log('开始数据迁移...');

    const documents = await prisma.document.findMany({
      include: {
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    console.log(`找到 ${documents.length} 个文档需要迁移`);

    for (const doc of documents) {
      const latestSnapshot = doc.snapshots[0];
      
      if (latestSnapshot) {
        console.log(`迁移文档: ${doc.id}`);
        
        await prisma.$executeRaw`
          INSERT INTO collaboration_documents (id, type, snapshot, version, created_at, updated_at)
          VALUES (
            ${doc.id},
            'gc.spread.sheets',
            ${latestSnapshot.data},
            ${latestSnapshot.version},
            NOW(),
            NOW()
          )
          ON DUPLICATE KEY UPDATE
            snapshot = VALUES(snapshot),
            version = VALUES(version),
            updated_at = NOW()
        `;

        console.log(`文档 ${doc.id} 迁移完成`);
      }
    }

    console.log('数据迁移完成！');
  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

- [ ] **Step 2: 添加迁移脚本到 package.json**

```json
{
  "scripts": {
    "migrate:collaboration": "tsx scripts/migrate-to-collaboration.ts"
  }
}
```

- [ ] **Step 3: 提交迁移脚本**

```bash
git add server/scripts/migrate-to-collaboration.ts server/package.json
git commit -m "feat(server): add data migration script for collaboration"
```

---

## 总结

### 实施顺序

1. **服务端迁移** (Task 1-5)
   - 安装依赖
   - 创建类型定义
   - 实现 MySQL Adapter
   - 创建协同服务器
   - 删除旧代码

2. **客户端迁移** (Task 6-9)
   - 安装依赖
   - 创建 Hook
   - 重构组件
   - 删除旧代码

3. **测试与验证** (Task 10-11)
   - 集成测试
   - 完整测试

4. **数据迁移** (Task 12)
   - 创建迁移脚本
   - 执行迁移

### 预计时间

- 服务端迁移: 2-3 小时
- 客户端迁移: 1-2 小时
- 测试与验证: 1 小时
- 数据迁移: 0.5 小时

**总计**: 4.5-6.5 小时

### 下一步

- 审核此实施计划
- 确认后开始执行
- 可选择子代理驱动或内联执行方式
