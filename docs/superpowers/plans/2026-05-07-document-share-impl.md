# 文档分享功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现文档分享功能，支持用户分享和链接分享两种方式，具备完整权限管理能力

**Architecture:**

- 后端扩展 DocumentService 处理分享逻辑，新增 DocumentShareLink 模型
- 前端新增分享侧边栏和弹窗组件，与文档编辑页面集成
- 协作服务器根据用户权限设置编辑/只读模式

**Tech Stack:**

- 后端: Node.js + Express + Prisma + MySQL + @grapecity-software/js-collaboration
- 前端: React + TypeScript + Tailwind CSS

---

## 文件结构

```
server/
├── prisma/schema.prisma                    # 新增 DocumentShareLink 模型
├── src/
│   ├── services/document.service.ts        # 新增链接分享方法
│   ├── controllers/document.controller.ts  # 新增分享相关接口
│   ├── routes/document.routes.ts           # 新增路由
│   └── collaboration/index.ts              # 修改权限验证逻辑

client/
├── src/
│   ├── components/
│   │   └── DocumentSidebar.tsx             # 新增：文档侧边栏（成员+链接）
│   ├── services/api/document.service.ts     # 新增链接分享API
│   └── pages/DocumentEdit/index.tsx        # 集成侧边栏组件
```

---

## Task 1: 数据库迁移 - 添加 DocumentShareLink 表

**Files:**

- Modify: `server/prisma/schema.prisma:63-82` (在 DocumentMember 后添加新模型)
- Run: `npx prisma migrate dev --name add-document-share-link`

- [ ] **Step 1: 修改 Prisma Schema**

```prisma
model DocumentShareLink {
  id          String    @id @default(uuid())
  documentId  String
  token       String    @unique
  permission  String    @default("read")
  createdBy   String
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?

  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([documentId])
}
```

将以上模型添加到 schema.prisma 中 DocumentMember 模型之后。

- [ ] **Step 2: 执行数据库迁移**

```bash
cd d:\test\spreadDemo\server
npx prisma migrate dev --name add-document-share-link
```

Expected: 迁移成功，生成新的迁移文件

---

## Task 2: 后端 - DocumentService 添加链接分享方法

**Files:**

- Modify: `server/src/services/document.service.ts:107-153` (在类末尾添加新方法)

- [ ] **Step 1: 添加链接分享方法到 DocumentService**

```typescript
async createShareLink(
  documentId: string,
  createdBy: string,
  permission: 'read' | 'edit',
  expiresAt?: Date
) {
  const token = crypto.randomUUID()
  const shareLink = await prisma.documentShareLink.create({
    data: {
      documentId,
      token,
      permission,
      createdBy,
      expiresAt,
    },
  })
  logger.info('分享链接创建成功', { documentId, token, permission })
  return shareLink
}

async getShareLink(token: string) {
  return prisma.documentShareLink.findUnique({
    where: { token },
    include: {
      document: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })
}

async validateShareLink(token: string) {
  const link = await prisma.documentShareLink.findUnique({
    where: { token },
  })

  if (!link) {
    return { valid: false, reason: '链接不存在' }
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { valid: false, reason: '链接已过期' }
  }

  return {
    valid: true,
    documentId: link.documentId,
    permission: link.permission,
  }
}

async deleteShareLink(id: string) {
  await prisma.documentShareLink.delete({
    where: { id },
  })
  logger.info('分享链接删除成功', { id })
}

async getShareLinks(documentId: string) {
  return prisma.documentShareLink.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  })
}
```

- [ ] **Step 2: 验证编译**

```bash
cd d:\test\spreadDemo\server
npx tsc --noEmit
```

Expected: 无编译错误

---

## Task 3: 后端 - DocumentController 添加分享接口

**Files:**

- Modify: `server/src/controllers/document.controller.ts:1-200` (添加新方法)
- Modify: `server/src/routes/document.routes.ts:55-65` (添加新路由)

- [ ] **Step 1: 在 DocumentController 添加链接分享方法**

```typescript
async createShareLink(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params
  const { permission = 'read', expiresAt } = req.body
  const userId = (req as any).user.id

  if (!['read', 'edit'].includes(permission)) {
    res.status(400).json({ error: '无效的权限类型' })
    return
  }

  const shareLink = await documentService.createShareLink(
    id,
    userId,
    permission,
    expiresAt ? new Date(expiresAt) : undefined
  )

  res.status(201).json({
    id: shareLink.id,
    token: shareLink.token,
    permission: shareLink.permission,
    expiresAt: shareLink.expiresAt,
    link: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${shareLink.token}`,
  })
}

async getShareLinks(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params
  const links = await documentService.getShareLinks(id)

  res.json(links.map(link => ({
    id: link.id,
    token: link.token,
    permission: link.permission,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
    link: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${link.token}`,
  })))
}

async deleteShareLink(req: Request, res: Response, next: NextFunction) {
  const { id, linkId } = req.params
  await documentService.deleteShareLink(linkId)
  res.status(204).send()
}

async validateShareLink(req: Request, res: Response, next: NextFunction) {
  const { token } = req.params
  const result = await documentService.validateShareLink(token)

  if (!result.valid) {
    res.status(403).json({ error: result.reason })
    return
  }

  res.json(result)
}

async updateMemberRole(req: Request, res: Response, next: NextFunction) {
  const { id, userId } = req.params
  const { role } = req.body

  if (!['viewer', 'editor'].includes(role)) {
    res.status(400).json({ error: '无效的角色' })
    return
  }

  const member = await prisma.documentMember.update({
    where: { documentId_userId: { documentId: id, userId } },
    data: { role },
    include: { user: { select: { id: true, username: true } } },
  })

  res.json(member)
}
```

- [ ] **Step 2: 在 document.routes.ts 添加新路由**

```typescript
router.post("/:id/share-link", documentAccessMiddleware, (req, res, next) =>
  documentController
    .createShareLink(req, res, next)
    .then(() => next())
    .catch(next),
);
router.get("/:id/share-links", documentAccessMiddleware, (req, res, next) =>
  documentController
    .getShareLinks(req, res, next)
    .then(() => next())
    .catch(next),
);
router.delete(
  "/:id/share-links/:linkId",
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) =>
    documentController
      .deleteShareLink(req, res, next)
      .then(() => next())
      .catch(next),
);
router.patch(
  "/:id/members/:userId",
  documentAccessMiddleware,
  documentOwnerMiddleware,
  (req, res, next) =>
    documentController
      .updateMemberRole(req, res, next)
      .then(() => next())
      .catch(next),
);

router.get("/share-link/:token", (req, res, next) =>
  documentController
    .validateShareLink(req, res, next)
    .then(() => next())
    .catch(next),
);
```

- [ ] **Step 3: 验证编译**

```bash
cd d:\test\spreadDemo\server
npx tsc --noEmit
```

Expected: 无编译错误

---

## Task 4: 后端 - 协作服务器权限验证集成

**Files:**

- Modify: `server/src/collaboration/index.ts:35-60` (修改 connect 中间件)

- [ ] **Step 1: 修改 connect 中间件读取用户权限**

```typescript
this.server.use("connect", async (context: any, next: any) => {
  const token = context.connection.auth?.token;
  if (!token) {
    return await next("未提供令牌");
  }
  try {
    const user = extractUserFromToken(token);
    const userWithPermission = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        members: {
          where: { documentId: context.connection.room },
          take: 1,
        },
      },
    });

    const member = userWithPermission?.members[0];
    const role = member?.role || "viewer";

    context.connection.tags.set("user", {
      id: user.id,
      username: user.username,
      role,
    });
    await next();
  } catch {
    await next("令牌无效");
  }
});
```

- [ ] **Step 2: 添加 submit 权限验证中间件**

```typescript
this.documentServices.use("submit", async (context: any, next: any) => {
  const userInfo = context.connection.tags.get("user");
  if (!userInfo) {
    await next("用户未认证");
    return;
  }
  if (userInfo.role === "viewer") {
    await next("只读用户无法编辑");
    return;
  }
  await next();
});
```

- [ ] **Step 3: 验证编译**

```bash
cd d:\test\spreadDemo\server
npx tsc --noEmit
```

Expected: 无编译错误

---

## Task 5: 前端 - DocumentService 添加链接分享 API

**Files:**

- Modify: `client/src/services/api/document.service.ts:85-95` (添加新方法)

- [ ] **Step 1: 添加链接分享相关方法**

```typescript
async createShareLink(documentId: string, permission: 'read' | 'edit', expiresAt?: string) {
  return axiosInstance.post(`/documents/${documentId}/share-link`, { permission, expiresAt })
},

async getShareLinks(documentId: string) {
  return axiosInstance.get(`/documents/${documentId}/share-links`)
},

async deleteShareLink(documentId: string, linkId: string) {
  return axiosInstance.delete(`/documents/${documentId}/share-links/${linkId}`)
},

async updateMemberRole(documentId: string, userId: string, role: 'viewer' | 'editor') {
  return axiosInstance.patch(`/documents/${documentId}/members/${userId}`, { role })
},

async validateShareLink(token: string) {
  return axiosInstance.get(`/documents/share-link/${token}`)
},
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd d:\test\spreadDemo\client
npx tsc --noEmit
```

Expected: 无编译错误

---

## Task 6: 前端 - 创建分享侧边栏组件

**Files:**

- Create: `client/src/components/DocumentSidebar.tsx`
- Modify: `client/src/pages/DocumentEdit/index.tsx` (集成侧边栏)

- [ ] **Step 1: 创建 DocumentSidebar 组件**

```tsx
import React, { useState, useEffect } from "react";
import { documentService } from "../../services/api/document.service";

interface DocumentMember {
  id: string;
  userId: string;
  role: "viewer" | "editor" | "owner";
  user: { id: string; username: string };
}

interface ShareLink {
  id: string;
  token: string;
  permission: "read" | "edit";
  createdAt: string;
  expiresAt?: string;
  link: string;
}

interface Props {
  documentId: string;
  currentUserId: string;
}

export const DocumentSidebar: React.FC<Props> = ({
  documentId,
  currentUserId,
}) => {
  const [members, setMembers] = useState<DocumentMember[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "links">("users");

  useEffect(() => {
    loadData();
  }, [documentId]);

  const loadData = async () => {
    const [membersRes, linksRes] = await Promise.all([
      documentService.getDocumentMembers(documentId),
      documentService.getShareLinks(documentId),
    ]);
    setMembers(membersRes.data);
    setShareLinks(linksRes.data);
  };

  const handleRemoveMember = async (userId: string) => {
    await documentService.removeMember(documentId, userId);
    loadData();
  };

  const handleUpdateRole = async (
    userId: string,
    role: "viewer" | "editor",
  ) => {
    await documentService.updateMemberRole(documentId, userId, role);
    loadData();
  };

  const handleDeleteLink = async (linkId: string) => {
    await documentService.deleteShareLink(documentId, linkId);
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isOwner = members.some(
    (m) => m.userId === currentUserId && m.role === "owner",
  );

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">文档设置</h2>

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "users" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          成员 ({members.length})
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "links" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("links")}
        >
          分享链接 ({shareLinks.length})
        </button>
      </div>

      {activeTab === "users" && (
        <div>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                    {member.user.username[0]}
                  </span>
                  <span>{member.user.username}</span>
                  <span className="text-xs text-gray-500">({member.role})</span>
                </div>
                {isOwner && member.role !== "owner" && (
                  <div className="flex gap-1">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(
                          member.userId,
                          e.target.value as "viewer" | "editor",
                        )
                      }
                      className="text-xs border rounded px-1"
                    >
                      <option value="viewer">只读</option>
                      <option value="editor">编辑</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      className="text-red-500 text-xs"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 添加成员
          </button>
        </div>
      )}

      {activeTab === "links" && (
        <div>
          <div className="space-y-2">
            {shareLinks.map((link) => (
              <div key={link.id} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {link.permission === "edit" ? "编辑" : "只读"}链接
                    {link.expiresAt &&
                      ` · ${new Date(link.expiresAt).toLocaleDateString()}`}
                  </span>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-500 text-xs"
                  >
                    删除
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={link.link}
                    className="flex-1 text-xs border px-2 py-1 rounded bg-white"
                  />
                  <button
                    onClick={() => copyToClipboard(link.link)}
                    className="text-xs bg-gray-200 px-2 py-1 rounded"
                  >
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowShareModal(true)}
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 生成链接
          </button>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          documentId={documentId}
          activeTab={activeTab}
          onClose={() => {
            setShowShareModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

const ShareModal: React.FC<{
  documentId: string;
  activeTab: "users" | "links";
  onClose: () => void;
}> = ({ documentId, activeTab, onClose }) => {
  const [tab, setTab] = useState<"users" | "links">(activeTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [permission, setPermission] = useState<"read" | "edit">("read");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleSearch = async () => {
    // TODO: 实现用户搜索
    setSearchResults([]);
  };

  const handleShareToUser = async (userId: string) => {
    await documentService.shareDocument(documentId, userId, permission);
    onClose();
  };

  const handleGenerateLink = async () => {
    const res = await documentService.createShareLink(documentId, permission);
    setGeneratedLink(res.data.link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">分享文档</h3>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${tab === "users" ? "border-b-2 border-blue-500" : ""}`}
            onClick={() => setTab("users")}
          >
            分享给用户
          </button>
          <button
            className={`px-4 py-2 ${tab === "links" ? "border-b-2 border-blue-500" : ""}`}
            onClick={() => setTab("links")}
          >
            生成分享链接
          </button>
        </div>

        {tab === "users" && (
          <div>
            <input
              type="text"
              placeholder="搜索用户名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />
            <div className="max-h-40 overflow-y-auto mb-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                  onClick={() => handleShareToUser(user.id)}
                >
                  {user.username}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "links" && (
          <div>
            {!generatedLink ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm mb-2">链接权限</label>
                  <select
                    value={permission}
                    onChange={(e) =>
                      setPermission(e.target.value as "read" | "edit")
                    }
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="read">只读</option>
                    <option value="edit">可编辑</option>
                  </select>
                </div>
                <button
                  onClick={handleGenerateLink}
                  className="w-full py-2 bg-blue-500 text-white rounded"
                >
                  生成链接
                </button>
              </>
            ) : (
              <div>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full border px-3 py-2 rounded mb-3"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  className="w-full py-2 bg-green-500 text-white rounded"
                >
                  复制链接
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 border border-gray-300 rounded"
        >
          关闭
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: 在 DocumentEdit 页面集成侧边栏**

```tsx
import { DocumentSidebar } from "../../components/DocumentSidebar";

// 在 DocumentEdit 组件中添加
const currentUserId = "current-user-id"; // 从 AuthContext 获取

return (
  <div className="flex h-screen">
    <div className="flex-1">
      <SpreadsheetEditor documentId={id} />
    </div>
    <DocumentSidebar documentId={id} currentUserId={currentUserId} />
  </div>
);
```

- [ ] **Step 3: 验证编译**

```bash
cd d:\test\spreadDemo\client
npx tsc --noEmit
```

Expected: 无编译错误

---

## Task 7: 前端 - 添加邀请链接处理页面

**Files:**

- Create: `client/src/pages/InviteLink/index.tsx` (处理 /invite/:token 路由)

- [ ] **Step 1: 创建邀请链接处理页面**

```tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentService } from "../../services/api/document.service";

export const InviteLinkPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleInvite = async () => {
      try {
        const res = await documentService.validateShareLink(token!);

        if (!res.data.valid) {
          setError(res.data.reason || "链接无效");
          setLoading(false);
          return;
        }

        // 自动添加到 DocumentMember（如果尚未添加）
        // 这部分可能需要后端配合，或者前端直接跳转并让后端在进入时处理
        navigate(`/document/${res.data.documentId}`);
      } catch (err: any) {
        setError(err.response?.data?.error || "链接验证失败");
        setLoading(false);
      }
    };

    handleInvite();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">正在验证邀请链接...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl text-red-500 mb-4">{error}</h1>
          <button
            onClick={() => navigate("/documents")}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            返回文档列表
          </button>
        </div>
      </div>
    );
  }

  return null;
};
```

- [ ] **Step 2: 添加路由配置**

在 `client/src/App.tsx` 中添加：

```tsx
import { InviteLinkPage } from "./pages/InviteLink";

<Route path="/invite/:token" element={<InviteLinkPage />} />;
```

- [ ] **Step 3: 验证编译**

```bash
cd d:\test\spreadDemo\client
npx tsc --noEmit
```

Expected: 无编译错误

---

## 实现顺序

1. **Task 1** - 数据库迁移（必须先执行）
2. **Task 2** - DocumentService（后端基础）
3. **Task 3** - DocumentController + Routes（后端接口）
4. **Task 4** - 协作服务器权限集成（核心功能）
5. **Task 5** - 前端 DocumentService（前端基础）
6. **Task 6** - DocumentSidebar 组件（UI 组件）
7. **Task 7** - 邀请链接处理页面（收尾）

---

## 验证清单

- [ ] 数据库迁移成功
- [ ] 分享给用户 API 正常工作
- [ ] 生成/删除分享链接 API 正常工作
- [ ] 链接验证 API 正常工作
- [ ] 协作服务器正确识别用户权限
- [ ] 只读用户无法提交 changesets
- [ ] 前端侧边栏正常显示成员和链接
- [ ] 分享弹窗可生成链接并复制
- [ ] 邀请链接页面可正常跳转

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-07-document-share-impl.md`**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
