import React, { useRef, useCallback } from 'react'
import GC from '@grapecity-software/spread-sheets'
import { SpreadSheets, Worksheet } from '@grapecity-software/spread-sheets-react'
import '@grapecity-software/spread-sheets/styles/gc.spread.sheets.excel2013white.css'
import { useSpreadCollaboration } from '../../hooks/useSpreadCollaboration'
interface SpreadsheetEditorProps {
  documentId: string
  onAccessDenied?: () => void
  userId: string
  username: string
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  documentId,
  onAccessDenied,
  userId,
  username,
}) => {
  const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null)
  const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000'
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

  const loadingStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    zIndex: 1000,
  }

  const errorStyles: React.CSSProperties = {
    ...loadingStyles,
    background: 'rgba(255,0,0,0.5)',
  }

  const overlayStyles: React.CSSProperties = {
    ...loadingStyles,
    background: 'rgba(0,0,0,0.3)',
  }

  if (isLoading) {
    return <div style={loadingStyles}>正在连接协同服务器...</div>
  }

  if (error) {
    return <div style={errorStyles}>连接失败: {error.message}</div>
  }

  return (
    <div style={{ position: 'relative' }}>
      <SpreadSheets
        backColor="aliceblue"
        hostStyle={{ width: '100%', height: '600px' }}
        workbookInitialized={handleWorkbookInitialized}
      >
        <Worksheet name="Sheet1" />
      </SpreadSheets>
      {!isConnected && <div style={overlayStyles}>正在连接协同服务器...</div>}
    </div>
  )
}
