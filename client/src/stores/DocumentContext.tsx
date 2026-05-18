import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { documentService, Document } from '../services/api/document.service'
import type GC from '@grapecity-software/spread-sheets'

export type SpreadWorkbook = GC.Spread.Sheets.Workbook
interface DocumentContextType {
  document: Document | null
  loading: boolean
  error: string | null
  loadDocument: (id: string) => Promise<void>
  updateDocument: (title: string) => Promise<void>
  workbook: SpreadWorkbook | null
  setWorkbook: (wb: SpreadWorkbook) => void
  isReady: boolean
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocument = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await documentService.getDocument(id)
      setDocument(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文档失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDocument = useCallback(
    async (title: string) => {
      if (!document) return

      try {
        await documentService.updateDocument(document.id, title)
        setDocument({ ...document, title })
      } catch (err) {
        throw err
      }
    },
    [document]
  )

  const [isReady, setIsReady] = useState(false)
  const workbookRef = useRef<SpreadWorkbook | null>(null)
  const setWorkbook = useCallback((wb: SpreadWorkbook) => {
    console.log('setWorkbook', wb)
    workbookRef.current = wb
    setIsReady(true)
  }, [])

  return (
    <DocumentContext.Provider
      value={{
        document,
        loading,
        error,
        loadDocument,
        updateDocument,
        get workbook() {
          return workbookRef.current
        },
        setWorkbook,
        isReady,
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
