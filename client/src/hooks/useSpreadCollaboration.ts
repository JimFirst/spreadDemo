import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@grapecity-software/js-collaboration-client'
import * as OT from '@grapecity-software/js-collaboration-ot-client'
import { type, bind, bindPresence } from '@grapecity-software/spread-sheets-collaboration-client'
import { Presence } from '@grapecity-software/js-collaboration-presence-client'
import '@grapecity-software/spread-sheets-collaboration-addon'
import GC from '@grapecity-software/spread-sheets'
import { documentService } from '../services/api/document.service'
import { useDocument } from '@/stores/DocumentContext'

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

  const clientRef = useRef<Client | null>(null)
  const docRef = useRef<OT.SharedDoc | null>(null)
  const presenceRef = useRef<Presence<GC.Spread.Sheets.PresenceData> | null>(null)
  const initCollaboration = async (documentId: string) => {
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
  useEffect(() => {
    if (!documentId || !serverUrl) {
      setIsLoading(false)
      return
    }
    initCollaboration(documentId)

    return () => {
      disconnect()
    }
  }, [documentId])
  const { setWorkbook } = useDocument()

  const bindWorkbook = useCallback(
    async (workbook: GC.Spread.Sheets.Workbook) => {
      setWorkbook(workbook)
      if (docRef.current) {
        await docRef.current.fetch()

        if (!docRef.current.type) {
          if (workbook.collaboration) {
            const snapshot = workbook.collaboration.toSnapshot()
            await docRef.current.create(snapshot, type.uri, {})
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
      clientRef.current = null
    }
    if (docRef.current) {
      docRef.current = null
    }
    if (presenceRef.current) {
      presenceRef.current = null
    }
    setIsConnected(false)
  }, [])

  return {
    isConnected,
    isLoading,
    error,
    userRole,
    bindWorkbook,
  }
}
