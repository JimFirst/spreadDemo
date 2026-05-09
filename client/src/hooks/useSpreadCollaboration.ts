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
  onError?: (error: Error & { code?: number }) => void
  userId: string
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
  onError,
  userId,
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
  const pendingBindRef = useRef(false)

  useEffect(() => {
    if (!documentId || !serverUrl) {
      setIsLoading(false)
      return
    }

    const initCollaboration = async () => {
      try {
        console.log('=== 开始初始化协同 ===')
        console.log('文档 ID:', documentId)
        console.log('用户 ID:', userId)

        OT.TypesManager.register(type)

        const client = new Client(serverUrl)

        const connection = client.connect(documentId, {
          query: {
            id: documentId,
          },
          auth: {
            token: userId,
          },
        })
        clientRef.current = client

        const doc = new OT.SharedDoc(connection)
        docRef.current = doc
        console.log('SharedDoc 实例已创建', doc)

        doc.on('error', (err: Error & { code?: number }) => {
          setError(err)
          setErrorCode(err.code)
          onError?.(err)
          console.error('协同错误:', err)
        })

        console.log('协同客户端初始化完成，等待 bindWorkbook...')
        setIsConnected(true)
        setIsLoading(false)
        isInitializedRef.current = true
        console.log('=== 协同初始化完成 ===')
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
      pendingBindRef.current = false
    }
  }, [documentId])

  const bindWorkbook = useCallback(async (workbook: GC.Spread.Sheets.Workbook) => {
    workbookRef.current = workbook
    if (docRef.current) {
      console.log('正在获取文档...')
      await docRef.current.fetch()
      console.log('文档获取完成')
      console.log('doc.type:', docRef.current.type)
      console.log('doc.version:', docRef.current.version)
      console.log('doc.data:', docRef.current.data)

      if (!docRef.current.type) {
        if (workbook.collaboration) {
          console.log('创建新文档...')
          const snapshot = workbook.collaboration.toSnapshot()
          console.log('快照数据长度:', snapshot ? '有效' : '无效')
          await docRef.current.create(snapshot, type.uri, {})
          console.log('文档创建成功')
        } else {
          console.warn('Workbook collaboration 未初始化，等待...')
          pendingBindRef.current = true
        }
      } else {
        console.log('文档已存在，直接绑定...')
      }

      console.log('绑定 workbook')
      bind(workbook, docRef.current)
      console.log('✅ bind() 执行完成，文档已同步到 workbook')
    } else {
      console.error('❌ docRef.current 为 null，无法绑定')
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
