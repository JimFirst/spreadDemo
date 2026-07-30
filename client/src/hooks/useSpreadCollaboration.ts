import { useState, useCallback, useRef } from 'react'
import { Client } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import { type, bind, bindPresence } from '@grapecity-software/spread-sheets-collaboration-client'
import { Presence } from '@grapecity-software/js-collaboration-presence-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'
import { documentService } from '../services/api/document.service'

const COLOR_SCHEME = ['#0000ff', '#008000', '#9900cc', '#800000', '#00cc33', '#cc6600', '#cc0099']
const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

interface UseSpreadCollaborationOptions {
  userId: string
  username: string
  onError?: (error: Error & { code?: number }) => void
}

interface UseSpreadCollaborationReturn {
  isConnected: boolean
  isLoading: boolean
  error: Error | null
  userRole: 'editor' | 'viewer'
  initCollData: (workbook: GC.Spread.Sheets.Workbook, snapshot?: unknown) => Promise<void>
  initCollaboration: (documentId: string) => Promise<void>
  disconnect: () => void
}

export const useSpreadCollaboration = ({
  userId,
  username,
  onError,
}: UseSpreadCollaborationOptions): UseSpreadCollaborationReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [userRole, setUserRole] = useState<'editor' | 'viewer'>('editor')

  const clientRef = useRef<Client | null>(null)
  const docRef = useRef<OT.SharedDoc | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presenceRef = useRef<Presence<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectionRef = useRef<any>(null)

  const initCollaboration = async (documentId: string) => {
    try {
      const roleResponse = await documentService.getMyRole(documentId)
      const role = roleResponse.data?.role || 'viewer'
      setUserRole(role === 'viewer' ? 'viewer' : 'editor')

      OT.TypesManager.register(type)

      const client = new Client(serverUrl)
      clientRef.current = client

      const connection = client.connect(documentId, {
        auth: {
          token: userId,
        },
      })
      connectionRef.current = connection

      const doc = new OT.SharedDoc(connection)
      docRef.current = doc

      const presence = new Presence(connection)
      presenceRef.current = presence

      doc.on('error', (err: Error & { code?: number }) => {
        setError(err)
        onError?.(err)
      })

      setIsConnected(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Error', err)
      const errorWithCode = err as Error & { code?: number }
      setError(errorWithCode)
      onError?.(errorWithCode)
      setIsLoading(false)
    }
  }

  // 初始化数据
  const initCollData = useCallback(
    async (workbook: GC.Spread.Sheets.Workbook, snapshot?: unknown) => {
      if (docRef.current) {
        // 从服务端拉取文档状态
        setIsLoading(true)
        await docRef.current.fetch()
        if (!docRef.current.type) {
          // 创建新的共享文档并设置初始内容
          const initSnapshot = snapshot || workbook.collaboration.toSnapshot()
          await docRef.current.create(initSnapshot, type.uri, {})
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await bind(workbook, docRef.current as any)
        setIsLoading(false)
        if (presenceRef.current) {
          const permissionMode =
            userRole === 'viewer'
              ? GC.Spread.Sheets.Collaboration.BrowsingMode.view
              : GC.Spread.Sheets.Collaboration.BrowsingMode.edit

          const user: any = {
            id: userId,
            name: username,
            permission: {
              mode: permissionMode,
            },
          }
          await bindPresence(workbook, presenceRef.current, user, {
            colorScheme: COLOR_SCHEME,
          })
        }
      }
    },
    [userId, username, userRole]
  )

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current = null
    }
    if (docRef.current) {
      docRef.current = null
    }
    if (presenceRef.current) {
      presenceRef.current = null
    }
    if (connectionRef.current) {
      connectionRef.current?.close()
      connectionRef.current = null
    }
    setIsConnected(false)
  }, [])

  return {
    isConnected,
    isLoading,
    error,
    userRole,
    initCollData,
    initCollaboration,
    disconnect,
  }
}
