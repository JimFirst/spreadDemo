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
