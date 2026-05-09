import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import { type, bind, bindPresence } from '@grapecity-software/spread-sheets-collaboration-client'
import { Presence } from '@grapecity-software/js-collaboration-presence-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'
import { documentService } from '../services/api/document.service'

const COLOR_SCHEME = ['#0000ff', '#008000', '#9900cc', '#800000', '#00cc33', '#cc6600', '#cc0099']

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
  username: string
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
  username,
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
  const presenceRef = useRef<Presence<any> | null>(null)
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

        const presence = new Presence(connection)
        presenceRef.current = presence

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
      if (presenceRef.current) {
        presenceRef.current = null
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

        await bind(workbook, docRef.current)

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
