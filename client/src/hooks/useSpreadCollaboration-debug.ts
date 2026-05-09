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
  autoConnect = true,
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
    if (!autoConnect || !documentId || !serverUrl) {
      setIsLoading(false)
      return
    }

    const initCollaboration = async () => {
      try {
        console.log('=== 开始初始化协同 ===')
        console.log('服务器地址:', serverUrl)
        console.log('文档 ID:', documentId)
        console.log('用户 ID:', userId)

        OT.TypesManager.register(type)
        console.log('OT 类型已注册')

        const client = new Client(serverUrl)
        console.log('Client 实例已创建')

        const connection = client.connect(documentId, {
          auth: {
            token: userId,
          },
        })
        console.log('尝试连接到服务器...')
        clientRef.current = client

        const doc = new OT.SharedDoc(connection)
        docRef.current = doc
        console.log('SharedDoc 实例已创建')

        doc.on('error', (err: Error & { code?: number }) => {
          setError(err)
          setErrorCode(err.code)
          onError?.(err)
          console.error('协同错误:', err)
        })

        connection.on('open', () => {
          console.log('WebSocket 连接已打开')
        })

        console.log('正在获取文档...')
        await doc.fetch()
        console.log('文档获取完成')
        console.log('doc.type:', doc.type)
        
        console.log('=== 详细检查 doc.state 结构 ===')
        const docState = (doc as any).state
        console.log('doc.state 存在:', !!docState)
        if (docState) {
          console.log('doc.state 所有键:', Object.keys(docState))
          console.log('doc.state 结构:')
          console.log(JSON.stringify(docState, null, 2).substring(0, 500))
          
          console.log('\n--- 检查关键字段 ---')
          console.log('doc.state.snapshot:', docState.snapshot ? '存在' : '不存在')
          console.log('doc.state.sequences:', docState.sequences ? '存在' : '不存在')
          console.log('doc.state.operations:', docState.operations ? '存在' : '不存在')
          console.log('doc.state.pendingOps:', docState.pendingOps ? '存在' : '不存在')
          
          if (docState.sequences) {
            console.log('sequences 数量:', docState.sequences.length)
            console.log('sequences 内容预览:', JSON.stringify(docState.sequences).substring(0, 200))
          }
          
          if (docState.snapshot) {
            console.log('snapshot 所有键:', Object.keys(docState.snapshot))
          }
        }
        console.log('=== doc.state 检查完成 ===\n')

        if (!doc.type && workbookRef.current) {
          if (workbookRef.current.collaboration) {
            console.log('创建新文档...')
            const snapshot = workbookRef.current.collaboration.toSnapshot()
            console.log('快照数据长度:', snapshot ? '有效' : '无效')
            await doc.create(snapshot, type.uri, {})
            console.log('文档创建成功，绑定 workbook')
            bind(workbookRef.current, doc)
          } else {
            console.warn('Workbook collaboration 未初始化，等待...')
            pendingBindRef.current = true
          }
        } else if (doc.type && workbookRef.current) {
          console.log('文档已存在，准备绑定并同步...')

          console.log('=== 准备同步 ===')
          console.log('doc.type:', doc.type)
          console.log('workbookRef.current:', !!workbookRef.current)
          console.log('workbookRef.current.collaboration:', !!workbookRef.current?.collaboration)

          doc.on('sync', () => {
            console.log('✅ Sync 事件触发，文档已同步')
            if (workbookRef.current && workbookRef.current.collaboration) {
              const syncState = (doc as any).state
              console.log('同步后的 doc.state:')
              console.log(JSON.stringify(syncState, null, 2).substring(0, 500))
            }
          })

          doc.on('sync-error', (err: Error) => {
            console.error('❌ Sync 错误:', err)
          })

          console.log('绑定 workbook')
          bind(workbookRef.current, doc)

          console.log('bind 已调用，准备调用 doc.sync()...')
          console.log('调用前 - doc.state.snapshot:', !!(docState && docState.snapshot))
          
          if (docState && docState.snapshot) {
            console.log('✅ 服务器有快照数据，触发同步...')
            await doc.sync()
            console.log('✅ doc.sync() 执行完成')
          } else {
            console.log('⚠️ 没有快照数据，但仍尝试同步...')
            console.log('检查 doc.state.sequences:', docState?.sequences?.length || 0, '个')
            await doc.sync()
            console.log('✅ doc.sync() 执行完成（无快照）')
          }
        }

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
  }, [documentId, serverUrl, autoConnect])

  const bindWorkbook = useCallback(async (workbook: GC.Spread.Sheets.Workbook) => {
    workbookRef.current = workbook

    console.log('bindWorkbook 被调用', {
      hasDoc: !!docRef.current,
      docType: docRef.current?.type,
      hasCollaboration: !!workbook.collaboration,
      pendingBind: pendingBindRef.current,
    })

    if (docRef.current) {
      if (!docRef.current.type) {
        docRef.current.once('sync', async () => {
          if (!docRef.current!.type && workbookRef.current) {
            if (workbookRef.current.collaboration) {
              console.log('Sync 事件触发，创建文档...')
              await docRef.current!.create(
                workbookRef.current.collaboration.toSnapshot(),
                type.uri,
                {}
              )
              console.log('文档创建成功，绑定 workbook')
              bind(workbookRef.current, docRef.current!)
            } else {
              console.warn('Workbook collaboration 未初始化，跳过创建')
            }
          }
        })

        if (pendingBindRef.current && workbook.collaboration) {
          console.log('Workbook 已就绪，创建文档...')
          await docRef.current.create(workbook.collaboration.toSnapshot(), type.uri, {})
          console.log('文档创建成功，绑定 workbook')
          bind(workbook, docRef.current)
          pendingBindRef.current = false
        }
      } else {
        console.log('文档已存在，准备绑定并同步...')

        const docState = (docRef.current as any).state
        console.log('bindWorkbook - 检查 doc state:', {
          hasState: !!docState,
          docType: docRef.current?.type,
          hasSnapshot: !!(docState && docState.snapshot),
          hasSequences: !!(docState && docState.sequences),
          sequencesLength: docState?.sequences?.length || 0,
        })

        docRef.current.on('sync', () => {
          console.log('✅ Sync 事件触发（bindWorkbook），文档已同步')
          const syncState = (docRef.current as any).state
          console.log('同步后状态键:', Object.keys(syncState || {}))
          console.log('同步后 snapshot:', syncState?.snapshot ? '存在' : '不存在')
        })

        docRef.current.on('sync-error', (err: Error) => {
          console.error('❌ Sync 错误（bindWorkbook）:', err)
        })

        console.log('绑定 workbook')
        bind(workbook, docRef.current)

        const state = (docRef.current as any).state
        if (state && state.snapshot) {
          console.log('✅ 检测到服务器有快照数据，触发同步...')
          await docRef.current.sync()
          console.log('✅ doc.sync() 执行完成（bindWorkbook）')
        } else if (state && state.sequences && state.sequences.length > 0) {
          console.log('⚠️ 没有快照，但有操作历史，尝试同步...')
          console.log('操作数量:', state.sequences.length)
          await docRef.current.sync()
          console.log('✅ doc.sync() 执行完成（使用操作历史）')
        } else {
          console.log('⚠️ 既没有快照，也没有操作历史')
          console.log('尝试调用 sync()...')
          await docRef.current.sync()
          console.log('✅ doc.sync() 执行完成（无数据）')
        }
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
