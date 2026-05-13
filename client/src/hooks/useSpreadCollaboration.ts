import { useState, useEffect, useCallback, useRef } from 'react'
import { Client, Connection } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import {
  type,
  bind,
  bindPresence,
  IChangeSet,
  IPresence,
  IUserWithPermission,
} from '@grapecity-software/spread-sheets-collaboration-client'
import { Presence } from '@grapecity-software/js-collaboration-presence-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'
import { documentService } from '../services/api/document.service'

const COLOR_SCHEME = ['#0000ff', '#008000', '#9900cc', '#800000', '#00cc33', '#cc6600', '#cc0099']

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
  userRole: 'editor' | 'viewer'
  bindWorkbook: (workbook: GC.Spread.Sheets.Workbook) => void
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
  const [userRole, setUserRole] = useState<'editor' | 'viewer'>('editor')

  const connectionRef = useRef<Connection | null>(null)
  const docRef = useRef<OT.SharedDoc<unknown, IChangeSet> | null>(null)
  const presenceRef = useRef<Presence<IPresence> | null>(null)
  const shouldUseMockCollaboration =
    import.meta.env.VITE_MOCK_DOCUMENTS === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_MOCK_DOCUMENTS !== 'false')

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close()
      connectionRef.current = null
    }
    if (docRef.current) {
      docRef.current = null
    }
    if (presenceRef.current) {
      presenceRef.current = null
    }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (shouldUseMockCollaboration) {
      setIsConnected(true)
      setIsLoading(false)
      setError(null)
      setUserRole('editor')
      return
    }

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

        connectionRef.current = connection

        const doc = new OT.SharedDoc<unknown, IChangeSet>(connection)
        docRef.current = doc

        const presence = new Presence<IPresence>(connection)
        presenceRef.current = presence

        doc.on('error', (err: Error & { code?: number }) => {
          setError(err)
          onError?.(err)
        })

        setIsConnected(true)
        setIsLoading(false)
      } catch (err) {
        const errorWithCode = err as Error & { code?: number }
        setError(errorWithCode)
        onError?.(errorWithCode)
        setIsLoading(false)
      }
    }

    initCollaboration()

    return () => {
      disconnect()
    }
  }, [disconnect, documentId, onError, serverUrl, shouldUseMockCollaboration, userId])

  const bindWorkbook = useCallback(
    async (workbook: GC.Spread.Sheets.Workbook) => {
      if (shouldUseMockCollaboration) {
        return
      }

      if (docRef.current) {
        await docRef.current.fetch()

        if (!docRef.current.type && workbook.collaboration) {
          const snapshot = workbook.collaboration.toSnapshot()
          await docRef.current.create(snapshot, type.uri, {})
        }

        await bind(workbook, docRef.current)

        if (presenceRef.current) {
          const permissionMode =
            userRole === 'viewer'
              ? GC.Spread.Sheets.Collaboration.BrowsingMode.view
              : GC.Spread.Sheets.Collaboration.BrowsingMode.edit

          const user: IUserWithPermission = {
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
    [shouldUseMockCollaboration, userId, username, userRole]
  )

  return {
    isConnected,
    isLoading,
    error,
    userRole,
    bindWorkbook,
  }
}
