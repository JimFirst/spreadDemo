import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import GC from '@grapecity-software/spread-sheets'
import { SpreadSheets, Worksheet } from '@grapecity-software/spread-sheets-react'
import '@grapecity-software/spread-sheets/styles/gc.spread.sheets.excel2013white.css'
import { useSpreadCollaboration } from '../../hooks/useSpreadCollaboration'
import { createSpreadOperations, SpreadOperations } from '../../hooks/useSpreadOperations'
import './SpreadsheetEditor.scss'

export interface SpreadsheetEditorRef extends SpreadOperations {}

interface SpreadsheetEditorProps {
  documentId: string
  onAccessDenied?: () => void
  userId: string
  username: string
}

export const SpreadsheetEditor = forwardRef<SpreadsheetEditorRef, SpreadsheetEditorProps>(
  ({ documentId, onAccessDenied, userId, username }, ref) => {
    const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null)
    const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

    const getWorkbook = useCallback(() => spreadRef.current, [])
    const operationsRef = useRef<SpreadsheetEditorRef | null>(null)

    if (!operationsRef.current) {
      operationsRef.current = createSpreadOperations(getWorkbook)
    } else {
      Object.assign(operationsRef.current, createSpreadOperations(getWorkbook))
    }

    useImperativeHandle(ref, () => operationsRef.current as SpreadsheetEditorRef)

    const handleCollaborativeError = useCallback(
      (error: Error & { code?: number }) => {
        if (error.code === 1003) {
          onAccessDenied?.()
        }
      },
      [onAccessDenied]
    )

    const { isConnected, isLoading, error, bindWorkbook } = useSpreadCollaboration({
      documentId,
      serverUrl,
      onError: handleCollaborativeError,
      userId,
      username,
    })

    const handleWorkbookInitialized = useCallback(
      (spread: GC.Spread.Sheets.Workbook) => {
        spreadRef.current = spread
        bindWorkbook(spread)
      },
      [bindWorkbook]
    )

    if (isLoading) {
      return <div className="spreadsheet-editor__loading">正在连接协同服务器...</div>
    }

    if (error) {
      return <div className="spreadsheet-editor__error">连接失败: {error.message}</div>
    }

    return (
      <div className="spreadsheet-editor">
        <SpreadSheets
          backColor="aliceblue"
          hostStyle={{ width: '100%', height: '600px' }}
          workbookInitialized={handleWorkbookInitialized}
        >
          <Worksheet name="Sheet1" />
        </SpreadSheets>
        {!isConnected && <div className="spreadsheet-editor__overlay">正在连接协同服务器...</div>}
      </div>
    )
  }
)
