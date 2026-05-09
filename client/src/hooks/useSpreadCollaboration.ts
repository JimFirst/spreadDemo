import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import { type, bind } from '@grapecity-software/spread-sheets-collaboration-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'
import { documentService } from '../services/api/document.service'

const { BrowsingMode } = GC.Spread.Sheets.Collaboration

interface User {
  userId: string
  username: string
  role?: 'editor' | 'viewer'
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
  userRole: 'editor' | 'viewer'
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
  const [userRole, setUserRole] = useState<'editor' | 'viewer'>('editor')

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
        const roleResponse = await documentService.getMyRole(documentId)
        const role = roleResponse.data?.role || 'viewer'
        setUserRole(role === 'viewer' ? 'viewer' : 'editor')

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

        doc.on('error', (err: Error & { code?: number }) => {
          setError(err)
          setErrorCode(err.code)
          onError?.(err)
        })

        setIsConnected(true)
        setIsLoading(false)
        isInitializedRef.current = true
      } catch (err) {
        const errorWithCode = err as Error & { code?: number }
        setError(errorWithCode)
        setErrorCode(errorWithCode.code)
        onError?.(errorWithCode)
        setIsLoading(false)
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

  const bindWorkbook = useCallback(
    async (workbook: GC.Spread.Sheets.Workbook) => {
      workbookRef.current = workbook
      if (docRef.current) {
        await docRef.current.fetch()

        if (!docRef.current.type) {
          if (workbook.collaboration) {
            const snapshot = workbook.collaboration.toSnapshot()
            await docRef.current.create(snapshot, type.uri, {})
          } else {
            pendingBindRef.current = true
          }
        }

        const user = {
          userId: userId,
          name: '',
          permission: {
            mode: userRole === 'viewer' ? BrowsingMode.view : BrowsingMode.edit,
          },
        }
        workbook.collaboration.setUser(user)

        await bind(workbook, docRef.current)
      }
    },
    [userId, userRole]
  )

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
    userRole,
    bindWorkbook,
    disconnect,
  }
}
