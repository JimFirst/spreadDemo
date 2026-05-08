import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import { type, bind } from '@grapecity-software/spread-sheets-collaboration-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'

interface User {
  userId: string
  username: string
}

interface UseSpreadCollaborationOptions {
  documentId: string
  serverUrl: string
  autoConnect?: boolean
  onError?: (error: Error & { code?: number }) => void
}

interface UseSpreadCollaborationReturn {
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  errorCode?: number
  users: User[]
  bindWorkbook: (workbook: GC.Spread.Sheets.Workbook) => void
  disconnect: () => void
}

export const useSpreadCollaboration = ({
  documentId,
  serverUrl,
  autoConnect = true,
  onError,
}: UseSpreadCollaborationOptions): UseSpreadCollaborationReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [errorCode, setErrorCode] = useState<number | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])

  const clientRef = useRef<Client | null>(null)
  const docRef = useRef<OT.SharedDoc | null>(null)
  const workbookRef = useRef<GC.Spread.Sheets.Workbook | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!autoConnect || !documentId || !serverUrl) {
      setIsLoading(false)
      return
    }

    const initCollaboration = async () => {
      try {
        OT.TypesManager.register(type)

        const client = new Client(serverUrl)
        const connection = client.connect(documentId)
        clientRef.current = client

        const doc = new OT.SharedDoc(connection)
        docRef.current = doc

        doc.on('error', (err: Error & { code?: number }) => {
          setError(err)
          setErrorCode(err.code)
          onError?.(err)
          console.error('协同错误:', err)
        })

        await doc.fetch()

        if (!doc.type && workbookRef.current) {
          if (workbookRef.current.collaboration) {
            await doc.create(workbookRef.current.collaboration.toSnapshot(), type.uri, {})
            if (workbookRef.current) {
              bind(workbookRef.current, doc)
            }
          } else {
            console.warn('Workbook collaboration 未初始化，跳过创建')
          }
        } else if (doc.type && workbookRef.current) {
          bind(workbookRef.current, doc)
        }

        setIsConnected(true)
        setIsLoading(false)
        isInitializedRef.current = true
      } catch (err) {
        const errorWithCode = err as Error & { code?: number }
        setError(errorWithCode)
        setErrorCode(errorWithCode.code)
        onError?.(errorWithCode)
        setIsLoading(false)
        console.error('协同初始化失败:', err)
      }
    }

    initCollaboration()

    return () => {
      if (clientRef.current) {
        clientRef.current.close?.()
        clientRef.current = null
      }
      if (docRef.current) {
        docRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [documentId, serverUrl, autoConnect])

  const bindWorkbook = useCallback((workbook: GC.Spread.Sheets.Workbook) => {
    workbookRef.current = workbook

    if (docRef.current) {
      if (!docRef.current.type) {
        docRef.current.once('sync', async () => {
          if (!docRef.current!.type && workbookRef.current) {
            if (workbookRef.current.collaboration) {
              await docRef.current!.create(
                workbookRef.current.collaboration.toSnapshot(),
                type.uri,
                {}
              )
              bind(workbookRef.current, docRef.current!)
            } else {
              console.warn('Workbook collaboration 未初始化，跳过创建')
            }
          }
        })
      } else {
        bind(workbook, docRef.current)
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close()
      clientRef.current = null
    }
    if (docRef.current) {
      docRef.current = null
    }
    setIsConnected(false)
    setUsers([])
  }, [])

  return {
    isConnected,
    isLoading,
    error,
    errorCode,
    users,
    bindWorkbook,
    disconnect,
  }
}
