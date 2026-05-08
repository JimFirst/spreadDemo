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
  data: any
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

export const documentService = {
  getDocuments(page = 1, pageSize = 20) {
    return axiosInstance.get('/documents', {
      params: { page, pageSize },
    })
  },

  getDocument(id: string) {
    return axiosInstance.get(`/documents/${id}`)
  },

  createDocument(title: string) {
    return axiosInstance.post('/documents', { title })
  },

  updateDocument(id: string, title: string) {
    return axiosInstance.put(`/documents/${id}`, { title })
  },

  deleteDocument(id: string) {
    return axiosInstance.delete(`/documents/${id}`)
  },

  shareDocument(id: string, userId: string, role: string) {
    return axiosInstance.post(`/documents/${id}/share`, { userId, role })
  },

  getDocumentMembers(id: string) {
    return axiosInstance.get(`/documents/${id}/members`)
  },

  removeMember(documentId: string, userId: string) {
    return axiosInstance.delete(`/documents/${documentId}/members/${userId}`)
  },

  getSnapshots(documentId: string, page = 1, pageSize = 50) {
    return axiosInstance.get(`/documents/${documentId}/snapshots`, {
      params: { page, pageSize },
    })
  },

  createSnapshot(documentId: string, data: any) {
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
