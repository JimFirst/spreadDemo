# SpreadJS 协同服务器迁移设计文档

**日期**: 2026-05-07  
**状态**: 草稿  
**版本**: 1.0

## 1. 背景与目标

### 1.1 当前实现
- **客户端**: 使用 socket.io-client，通过自定义 `useWebSocket` 和 `useCollaboration` hooks 管理协同
- **服务端**: 使用 socket.io 服务器，自定义 `CollaborationHandler` 处理协同逻辑
- **同步方式**: 手动发送 changesets，手动处理快照更新
- **冲突处理**: 需要自己实现，无自动 OT (Operational Transformation)

### 1.2 目标实现
- **服务端**: 使用 `@grapecity-software/js-collaboration` 和 `@grapecity-software/js-collaboration-ot`
- **客户端**: 使用 `@grapecity-software/js-collaboration-client` 和 `@grapecity-software/js-collaboration-ot-client`
- **同步方式**: 通过 `bind()` 自动同步，使用 OT 自动冲突解决
- **用户状态**: 内置支持，无需手动实现

### 1.3 迁移范围
- ✅ 同时迁移客户端和服务端
- ✅ 保留现有数据库集成（MySQL）
- ✅ 保留现有 JWT 认证系统
- ❌ 不需要向后兼容性

## 2. 技术架构

### 2.1 架构对比

#### 当前架构
```
[客户端]                    [服务端]
   ↓                           ↓
useWebSocket (socket.io) → socket.io Server
   ↓                           ↓
useCollaboration              CollaborationHandler
   ↓                           ↓
手动同步                      手动 OT
```

#### 目标架构
```
[客户端]                    [服务端]
   ↓                           ↓
js-collaboration-client   js-collaboration Server
   ↓                           ↓
bind(workbook, doc)        OT.DocumentServices
   ↓                           ↓
自动同步                    自动 OT
```

### 2.2 核心组件

#### 2.2.1 服务端组件
- `js-collaboration` Server 实例
- `js-collaboration-ot` OT 文档服务
- `spread-sheets-collaboration` SpreadJS 类型定义
- 自定义 MySQL Database Adapter

#### 2.2.2 客户端组件
- `js-collaboration-client` Client 实例
- `js-collaboration-ot-client` SharedDoc 管理
- `spread-sheets-collaboration-client` bind() 函数

## 3. 服务端迁移设计

### 3.1 依赖更新

```json
{
  "dependencies": {
    "@grapecity-software/js-collaboration": "^1.0.0",
    "@grapecity-software/js-collaboration-ot": "^1.0.0",
    "@grapecity-software/spread-sheets-collaboration": "^18.2.5",
    "express": "^4.18.2"
  }
}
```

### 3.2 文件结构

```
server/src/
├── collaboration/
│   ├── index.ts              # 协同服务器初始化
│   ├── mysql-adapter.ts      # MySQL 数据库适配器
│   └── types.ts              # 类型定义
├── websocket/
│   └── index.ts              # 保持为空文件或删除
├── app.ts
└── server.ts
```

### 3.3 服务端核心逻辑

#### 3.3.1 服务器初始化 (collaboration/index.ts)

```typescript
import express from 'express';
import http from 'http';
import { Server } from '@grapecity-software/js-collaboration';
import * as OT from '@grapecity-software/js-collaboration-ot';
import { type } from '@grapecity-software/spread-sheets-collaboration';
import { MySQLAdapter } from './mysql-adapter';

// 注册 SpreadJS 类型
OT.TypesManager.register(type);

// 初始化数据库适配器
const dbAdapter = new MySQLAdapter(prisma);

// 初始化 OT 文档服务
const documentServices = new OT.DocumentServices(dbAdapter);

// 创建协同服务器
const app = express();
const httpServer = http.createServer(app);
const server = new Server({ httpServer });

// 启用 OT 功能
server.useFeature(OT.documentFeature(documentServices));

// 静态文件服务
app.use(express.static('public'));

// 启动服务器
httpServer.listen(8080, () => {
  console.log('协同服务器运行在端口 8080');
});
```

#### 3.3.2 MySQL Database Adapter

需要实现官方的 Database Adapter 接口：

```typescript
interface DatabaseAdapter {
  // 创建文档
  createDocument(docId: string, snapshot: any, type: string, meta?: any): Promise<void>;
  
  // 获取文档
  getDocument(docId: string): Promise<Document | null>;
  
  // 更新文档快照
  updateSnapshot(docId: string, version: number, snapshot: any): Promise<void>;
  
  // 获取快照历史
  getSnapshotHistory(docId: string, offset: number, limit: number): Promise<Snapshot[]>;
  
  // 创建操作
  createOperation(docId: string, version: number, ops: Operation[]): Promise<void>;
  
  // 获取未同步操作
  getOperations(docId: string, version: number): Promise<Operation[]>;
  
  // 用户管理
  addUser(userId: string, username: string): Promise<void>;
  getUser(userId: string): Promise<User | null>;
  
  // 权限管理
  checkPermission(userId: string, docId: string, action: string): Promise<boolean>;
  grantPermission(userId: string, docId: string, permissions: string[]): Promise<void>;
}
```

#### 3.3.3 JWT 认证集成

官方协同服务器支持自定义认证中间件：

```typescript
// 添加认证中间件
server.useAuth((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.sub;
    req.username = decoded.name;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败' });
  }
});
```

### 3.4 删除的文件

- `server/src/websocket/index.ts` - 替换为新的协同服务器
- `server/src/websocket/handler.ts` - 逻辑已由官方库处理
- `server/src/websocket/rooms.ts` - 官方库内置房间管理

## 4. 客户端迁移设计

### 4.1 依赖更新

```json
{
  "dependencies": {
    "@grapecity-software/spread-sheets-collaboration-addon": "^18.2.5",
    "@grapecity-software/js-collaboration-client": "^1.0.0",
    "@grapecity-software/js-collaboration-ot-client": "^1.0.0",
    "@grapecity-software/spread-sheets-collaboration-client": "^1.0.0"
  },
  "devDependencies": {
    "socket.io-client": "^4.6.0"  // 可保留用于其他用途
  }
}
```

### 4.2 文件结构

```
client/src/
├── hooks/
│   ├── useCollaboration.ts    # 删除
│   ├── useWebSocket.ts         # 删除
│   └── useSpreadCollaboration.ts # 新建：协同状态管理
├── components/
│   └── spreadsheet/
│       └── SpreadsheetEditor.tsx  # 重写：使用 bind()
└── App.tsx
```

### 4.3 客户端核心逻辑

#### 4.3.1 useSpreadCollaboration Hook (新建)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@grapecity-software/js-collaboration-client';
import * as OT from '@grapecity-software/js-collaboration-ot-client';
import { type, bind } from '@grapecity-software/spread-sheets-collaboration-client';
import type GC from '@grapecity-software/spread-sheets';

interface UseSpreadCollaborationOptions {
  documentId: string;
  serverUrl: string;
  token?: string;
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
}: UseSpreadCollaborationOptions): UseSpreadCollaborationReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const clientRef = useRef<Client | null>(null);
  const docRef = useRef<OT.SharedDoc | null>(null);
  const workbookRef = useRef<GC.Spread.Sheets.Workbook | null>(null);
  
  useEffect(() => {
    const initCollaboration = async () => {
      try {
        // 注册类型
        OT.TypesManager.register(type);
        
        // 连接到服务器
        const client = new Client();
        await client.connect(serverUrl);
        clientRef.current = client;
        
        // 加入房间
        const doc = new OT.SharedDoc(client);
        await doc.fetch();
        docRef.current = doc;
        
        // 监听用户变化
        doc.on('user-join', (user: User) => {
          setUsers((prev) => [...prev, user]);
        });
        
        doc.on('user-leave', (user: User) => {
          setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        });
        
        // 监听错误
        doc.on('error', (err: Error) => {
          setError(err);
          console.error('协同错误:', err);
        });
        
        // 如果文档不存在，创建新文档
        if (!doc.type) {
          if (workbookRef.current) {
            await doc.create(
              workbookRef.current.collaboration.toSnapshot(),
              type.uri,
              {}
            );
          }
        }
        
        // 绑定工作簿
        if (workbookRef.current) {
          bind(workbookRef.current, doc);
        }
        
        setIsConnected(true);
        setIsLoading(false);
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
      }
    };
  }, [documentId, serverUrl, token]);
  
  const bindWorkbook = useCallback((workbook: GC.Spread.Sheets.Workbook) => {
    workbookRef.current = workbook;
    
    if (docRef.current && !docRef.current.type) {
      // 文档不存在，等待 doc.fetch() 后再创建
      docRef.current.once('sync', async () => {
        if (!docRef.current!.type && workbook) {
          await docRef.current!.create(
            workbook.collaboration.toSnapshot(),
            type.uri,
            {}
          );
          bind(workbook, docRef.current!);
        } else if (docRef.current!.type) {
          bind(workbook, docRef.current!);
        }
      });
    } else if (docRef.current) {
      bind(workbook, docRef.current);
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

#### 4.3.2 SpreadsheetEditor 组件重构

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
  const token = useAuthToken(); // 假设有这个 hook
  
  const {
    isConnected,
    isLoading,
    error,
    bindWorkbook,
  } = useSpreadCollaboration({
    documentId,
    serverUrl,
    token,
  });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 初始化 SpreadJS 工作簿
    const spread = new GC.Spread.Sheets.Workbook(
      containerRef.current,
      { sheetCount: 1 }
    );
    
    spreadRef.current = spread;
    
    // 绑定协同文档
    bindWorkbook(spread);
    
    // 设置初始数据（仅在没有协同文档时）
    if (initialData) {
      loadSnapshot(initialData);
    }
    
    return () => {
      if (spreadRef.current) {
        spreadRef.current.destroy();
        spreadRef.current = null;
      }
    };
  }, [documentId]);
  
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
  
  if (isLoading) {
    return (
      <div style={loadingStyles}>
        正在连接协同服务器...
      </div>
    );
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

### 4.4 删除的文件

- `client/src/hooks/useWebSocket.ts` - 不再需要
- `client/src/hooks/useCollaboration.ts` - 替换为 useSpreadCollaboration

## 5. 数据迁移

### 5.1 数据库表结构

官方协同库使用以下数据结构：

```sql
-- 文档表
CREATE TABLE collaboration_documents (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  snapshot LONGTEXT,
  version INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 操作历史表
CREATE TABLE collaboration_operations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_id VARCHAR(255) NOT NULL,
  version INT NOT NULL,
  operations LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_doc_version (doc_id, version),
  FOREIGN KEY (doc_id) REFERENCES collaboration_documents(id)
);

-- 用户表
CREATE TABLE collaboration_users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE collaboration_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_doc_user (doc_id, user_id),
  FOREIGN KEY (doc_id) REFERENCES collaboration_documents(id),
  FOREIGN KEY (user_id) REFERENCES collaboration_users(id)
);
```

### 5.2 数据迁移脚本

```typescript
// scripts/migrate-to-collaboration.ts
import { PrismaClient } from '@prisma/client';

async function migrateData() {
  const prisma = new PrismaClient();
  
  try {
    // 迁移文档
    const documents = await prisma.document.findMany({
      include: { snapshots: { orderBy: { version: 'desc' }, take: 1 } }
    });
    
    for (const doc of documents) {
      const latestSnapshot = doc.snapshots[0];
      if (latestSnapshot) {
        await prisma.$executeRaw`
          INSERT INTO collaboration_documents (id, type, snapshot, version)
          VALUES (${doc.id}, 'gc.spread.sheets', ${latestSnapshot.data}, ${latestSnapshot.version})
        `;
      }
    }
    
    console.log('数据迁移完成');
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
```

## 6. 配置与环境变量

### 6.1 服务端环境变量

```env
# .env
COLLABORATION_PORT=8080
COLLABORATION_CORS_ORIGIN=http://localhost:5173
COLLABORATION_JWT_SECRET=your-secret-key
```

### 6.2 客户端环境变量

```env
# .env.client
VITE_COLLABORATION_URL=http://localhost:8080
```

## 7. 错误处理

### 7.1 客户端错误处理

```typescript
// 错误类型
enum CollaborationError {
  CONNECTION_FAILED = '连接失败',
  AUTHENTICATION_FAILED = '认证失败',
  DOCUMENT_NOT_FOUND = '文档不存在',
  VERSION_CONFLICT = '版本冲突',
  NETWORK_ERROR = '网络错误',
}

// 错误处理策略
const errorStrategies = {
  [CollaborationError.CONNECTION_FAILED]: () => {
    // 重连逻辑
  },
  [CollaborationError.VERSION_CONFLICT]: () => {
    // 强制同步最新版本
  },
};
```

### 7.2 服务端错误处理

```typescript
// 全局错误处理
server.on('error', (error: Error) => {
  logger.error('协同服务器错误:', error);
});
```

## 8. 测试策略

### 8.1 单元测试

- MySQL Adapter 单元测试
- JWT 认证中间件测试
- 数据迁移脚本测试

### 8.2 集成测试

- 多客户端实时协同测试
- 冲突解决测试
- 断线重连测试

### 8.3 性能测试

- 并发用户压力测试
- 大文档性能测试
- 网络延迟模拟测试

## 9. 部署策略

### 9.1 服务端部署

```dockerfile
# Dockerfile.server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

### 9.2 客户端构建

```bash
# 构建客户端
cd client
npm install @grapecity-software/spread-sheets-collaboration-addon
npm run build
```

## 10. 风险评估与缓解

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 官方库版本不稳定 | 中 | 低 | 使用稳定版本，锁定依赖 |
| 数据库适配器复杂 | 高 | 中 | 参考官方 SQLite 实现 |
| 性能瓶颈 | 中 | 低 | 进行性能测试和优化 |

### 10.2 迁移风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 数据迁移失败 | 高 | 中 | 先备份，测试环境验证 |
| 协同功能不兼容 | 中 | 低 | 参考官方教程实现 |
| 认证集成问题 | 中 | 低 | 保持现有 JWT 机制 |

## 11. 时间估算

- **服务端迁移**: 2-3 天
  - 环境搭建和依赖安装: 0.5 天
  - MySQL Adapter 实现: 1 天
  - JWT 认证集成: 0.5 天
  - 测试和调试: 1 天

- **客户端迁移**: 1-2 天
  - 依赖安装和配置: 0.5 天
  - Hook 重写: 0.5 天
  - 组件重构: 0.5 天
  - 集成测试: 0.5 天

- **数据迁移**: 0.5 天
  - 脚本开发: 0.25 天
  - 数据验证: 0.25 天

**总计**: 3.5-5.5 天

## 12. 后续优化方向

1. **用户活动状态**: 实现用户光标位置实时同步
2. **用户权限**: 细粒度权限控制（只读、编辑、管理员）
3. **历史版本**: 实现文档版本回溯功能
4. **离线支持**: PWA 离线编辑和同步
5. **性能优化**: 大文档分片加载和懒加载

## 13. 参考资料

- [SpreadJS 协同框架文档](https://demo.grapecity.com.cn/spreadjs/help/docs/collaboration-server/spreadjs-sheets-collaboration)
- [js-collaboration API 文档](https://demo.grapecity.com.cn/spreadjs/help/api/collaboration/js-collaboration)
- [js-collaboration-ot API 文档](https://demo.grapecity.com.cn/spreadjs/help/api/collaboration/js-collaboration-ot)
- [官方实时协同设计器教程](https://demo.grapecity.com.cn/spreadjs/help/docs/collaboration-server/spreadjs-sheets-collaboration/tutorial-real-time-collaborative-spreadjs-designer)
