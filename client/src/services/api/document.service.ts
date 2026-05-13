import axiosInstance from './axios'

export interface Document {
  id: string
  title: string
  creatorId: string
  creator: {
    id: string
    username: string
  }
  createdAt: string
  updatedAt: string
  snapshots?: Snapshot[]
  members?: DocumentMember[]
}

export interface Snapshot {
  id: string
  documentId: string
  data: unknown
  version: number
  createdAt: string
}

export interface DocumentMember {
  id: string
  userId: string
  role: 'viewer' | 'editor' | 'owner'
  user: {
    id: string
    username: string
  }
}

export interface ShareLink {
  id: string
  token: string
  permission: 'read' | 'edit'
  createdAt: string
  expiresAt?: string
  link: string
}

const MOCK_DOCUMENTS_ENABLED =
  import.meta.env.VITE_MOCK_DOCUMENTS === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_MOCK_DOCUMENTS !== 'false')

const mockCreator = {
  id: 'user-001',
  username: '张三',
}

let mockDocuments: Document[] = [
  {
    id: 'mock-doc-001',
    title: '2026 年销售预测表',
    creatorId: mockCreator.id,
    creator: mockCreator,
    createdAt: '2026-05-08T02:18:00.000Z',
    updatedAt: '2026-05-12T03:26:00.000Z',
  },
  {
    id: 'mock-doc-002',
    title: '项目排期与资源计划',
    creatorId: 'user-002',
    creator: {
      id: 'user-002',
      username: '李四',
    },
    createdAt: '2026-05-06T06:40:00.000Z',
    updatedAt: '2026-05-11T09:15:00.000Z',
  },
  {
    id: 'mock-doc-003',
    title: '部门预算汇总',
    creatorId: 'user-003',
    creator: {
      id: 'user-003',
      username: '王五',
    },
    createdAt: '2026-04-28T01:05:00.000Z',
    updatedAt: '2026-05-10T12:30:00.000Z',
  },
  {
    id: 'mock-doc-004',
    title: '门店库存盘点',
    creatorId: mockCreator.id,
    creator: mockCreator,
    createdAt: '2026-04-18T08:45:00.000Z',
    updatedAt: '2026-05-09T04:52:00.000Z',
  },
]

const createMockResponse = <T,>(data: T) => Promise.resolve({ data })

const getMockDocument = (id: string) => {
  const document = mockDocuments.find(item => item.id === id)
  if (!document) {
    return mockDocuments[0]
  }
  return document
}

export const documentService = {
  getDocuments(page = 1, pageSize = 20) {
    if (MOCK_DOCUMENTS_ENABLED) {
      const start = (page - 1) * pageSize
      const list = mockDocuments.slice(start, start + pageSize)

      return createMockResponse({
        list,
        pagination: {
          page,
          pageSize,
          total: mockDocuments.length,
        },
      })
    }

    return axiosInstance.get('/documents', {
      params: { page, pageSize },
    })
  },

  getDocument(id: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse(getMockDocument(id))
    }

    return axiosInstance.get(`/documents/${id}`)
  },

  createDocument(title: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      const now = new Date().toISOString()
      const document: Document = {
        id: `mock-doc-${Date.now()}`,
        title,
        creatorId: mockCreator.id,
        creator: mockCreator,
        createdAt: now,
        updatedAt: now,
      }

      mockDocuments = [document, ...mockDocuments]

      return createMockResponse(document)
    }

    return axiosInstance.post('/documents', { title })
  },

  updateDocument(id: string, title: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      const now = new Date().toISOString()
      mockDocuments = mockDocuments.map(item =>
        item.id === id ? { ...item, title, updatedAt: now } : item
      )

      return createMockResponse(getMockDocument(id))
    }

    return axiosInstance.put(`/documents/${id}`, { title })
  },

  deleteDocument(id: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      mockDocuments = mockDocuments.filter(item => item.id !== id)
      return createMockResponse({ success: true })
    }

    return axiosInstance.delete(`/documents/${id}`)
  },

  shareDocument(id: string, userId: string, role: string) {
    return axiosInstance.post(`/documents/${id}/share`, { userId, role })
  },

  getDocumentMembers(id: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse([
        {
          id: `${id}-member-owner`,
          userId: mockCreator.id,
          role: 'owner' as const,
          user: mockCreator,
        },
        {
          id: `${id}-member-editor`,
          userId: 'user-002',
          role: 'editor' as const,
          user: {
            id: 'user-002',
            username: '李四',
          },
        },
      ])
    }

    return axiosInstance.get(`/documents/${id}/members`)
  },

  getMyRole(id: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse({
        documentId: id,
        role: 'editor' as const,
      })
    }

    return axiosInstance.get(`/documents/${id}/my-role`)
  },

  removeMember(documentId: string, userId: string) {
    return axiosInstance.delete(`/documents/${documentId}/members/${userId}`)
  },

  getSnapshots(documentId: string, page = 1, pageSize = 50) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse({
        list: [
          {
            id: `${documentId}-snapshot-001`,
            documentId,
            data: {},
            version: 1,
            createdAt: getMockDocument(documentId).updatedAt,
          },
        ],
        pagination: {
          page,
          pageSize,
          total: 1,
        },
      })
    }

    return axiosInstance.get(`/documents/${documentId}/snapshots`, {
      params: { page, pageSize },
    })
  },

  createSnapshot(documentId: string, data: unknown) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse({
        id: `${documentId}-snapshot-${Date.now()}`,
        documentId,
        data,
        version: 2,
        createdAt: new Date().toISOString(),
      })
    }

    return axiosInstance.post(`/documents/${documentId}/snapshots`, { data })
  },

  getChangeSets(documentId: string, page = 1, pageSize = 100) {
    return axiosInstance.get(`/documents/${documentId}/changesets`, {
      params: { page, pageSize },
    })
  },

  createShareLink(documentId: string, permission: 'read' | 'edit', expiresAt?: string) {
    return axiosInstance.post(`/documents/${documentId}/share-link`, { permission, expiresAt })
  },

  getShareLinks(documentId: string) {
    if (MOCK_DOCUMENTS_ENABLED) {
      return createMockResponse([
        {
          id: `${documentId}-share-link-001`,
          token: 'mock-share-token',
          permission: 'edit' as const,
          createdAt: getMockDocument(documentId).updatedAt,
          link: `${window.location.origin}/invite/mock-share-token`,
        },
      ])
    }

    return axiosInstance.get(`/documents/${documentId}/share-links`)
  },

  deleteShareLink(documentId: string, linkId: string) {
    return axiosInstance.delete(`/documents/${documentId}/share-links/${linkId}`)
  },

  updateMemberRole(documentId: string, userId: string, role: 'viewer' | 'editor') {
    return axiosInstance.patch(`/documents/${documentId}/members/${userId}`, { role })
  },

  validateShareLink(token: string) {
    return axiosInstance.get(`/documents/share-link/${token}`)
  },
}
