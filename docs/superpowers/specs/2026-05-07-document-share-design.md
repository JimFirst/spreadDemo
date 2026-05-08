# SpreadJS 文档分享功能设计

## 概述

实现两种文档分享方式：

1. **用户分享** - 选择系统已有用户进行分享
2. **链接分享** - 生成带权限令牌的链接，点击即获权限

## 数据模型

### 新增 DocumentShareLink 表

```prisma
model DocumentShareLink {
  id          String    @id @default(uuid())
  documentId  String
  token       String    @unique
  permission  String    @default("read")  // "read" | "edit"
  createdBy   String
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?

  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([documentId])
}
```

### 扩展 DocumentMember 权限

| role   | 说明                     |
| ------ | ------------------------ |
| owner  | 文档所有者，拥有所有权限 |
| editor | 可编辑文档（协同编辑）   |
| viewer | 只读权限                 |

## API 设计

### 1. 用户分享

| 方法   | 路径                             | 说明         |
| ------ | -------------------------------- | ------------ |
| POST   | `/documents/:id/members`         | 添加成员     |
| DELETE | `/documents/:id/members/:userId` | 移除成员     |
| PATCH  | `/documents/:id/members/:userId` | 修改成员权限 |
| GET    | `/documents/:id/members`         | 获取成员列表 |

**POST /documents/:id/members**

```json
Request: { "userId": "xxx", "role": "editor" }
Response: { "id": "xxx", "userId": "xxx", "role": "editor", "user": {...} }
```

### 2. 链接分享

| 方法   | 路径                                | 说明             |
| ------ | ----------------------------------- | ---------------- |
| POST   | `/documents/:id/share-link`         | 生成分享链接     |
| GET    | `/share-link/:token`                | 验证链接获取权限 |
| DELETE | `/documents/:id/share-link/:linkId` | 删除分享链接     |

**POST /documents/:id/share-link**

```json
Request: { "permission": "read" | "edit", "expiresAt": "2024-12-31" | null }
Response: { "id": "xxx", "token": "uuid", "link": "https://app.com/invite/uuid", "permission": "read" }
```

**GET /share-link/:token**

```json
Response: { "documentId": "xxx", "permission": "read", "valid": true }
```

### 3. 用户搜索

| 方法 | 路径                      | 说明     |
| ---- | ------------------------- | -------- |
| GET  | `/users/search?q=keyword` | 搜索用户 |

## 前端交互

### 文档侧边栏布局

```
┌─────────────────────────────┐
│ 📄 文档标题                   │
├─────────────────────────────┤
│ 👥 成员 (3)          [+ 添加] │
│ ┌─────────────────────────┐  │
│ │ 👤 张三 (所有者)          │  │
│ │ 👤 李四 (编辑)    [⋮]     │  │
│ │ 👤 王五 (只读)    [⋮]     │  │
│ └─────────────────────────┘  │
├─────────────────────────────┤
│ 🔗 分享链接 (2)    [+ 生成]   │
│ ┌─────────────────────────┐  │
│ │ 📎 只读链接 2024-01-01  🗑│  │
│ │ 📎 编辑链接 永久        🗑│  │
│ └─────────────────────────┘  │
└─────────────────────────────┘
```

### 分享弹窗

**Tab1: 分享给用户**

- 搜索框：输入用户名搜索
- 搜索结果列表：显示匹配用户
- 权限选择：只读 / 编辑
- 确认按钮

**Tab2: 生成分享链接**

- 权限选择：只读 / 编辑
- 有效期选择：永久 / 7天 / 30天 / 自定义
- 生成按钮 → 显示链接 → 复制按钮

### 成员操作菜单

点击 ⋮ 显示：

- 修改权限：只读 ↔ 编辑
- 移除成员（owner 不可移除）

## 后端实现要点

### 权限检查

1. **添加成员**：需要文档 owner/editor 权限
2. **移除/修改成员**：需要 owner 权限
3. **生成链接**：需要文档 owner/editor 权限
4. **删除链接**：需要 owner 权限
5. **通过链接访问**：无登录要求，验证 token 有效

### 协作服务器集成

在 `server/src/collaboration/index.ts` 中：

1. 连接认证时读取用户权限
2. 根据权限设置 `BrowsingMode.edit` 或 `BrowsingMode.view`
3. 编辑者才能提交 changesets

## 实现步骤

1. 数据库迁移：添加 DocumentShareLink 表
2. 后端 API：实现所有分享相关接口
3. 前端组件：侧边栏 + 分享弹窗
4. 链接分享：生成/验证/复制功能
5. 集成测试：验证权限控制正确
