import React, { useRef, useEffect, useCallback, useState } from 'react'
import GC from '@grapecity-software/spread-sheets'
import { SpreadSheets, Worksheet } from '@grapecity-software/spread-sheets-react'
import '@grapecity-software/spread-sheets/styles/gc.spread.sheets.excel2013white.css'
import { useSpreadCollaboration } from '../../hooks/useSpreadCollaboration'

interface CellData {
  row: number
  col: number
  value: unknown
}

interface SnapshotData {
  rowCount?: number
  columnCount?: number
  data?: CellData[]
  formulas?: Record<string, string>
  sheets?: unknown
  activeSheetIndex?: number
}

interface SpreadsheetEditorProps {
  documentId: string
  initialData?: SnapshotData
  onDataChange?: (data: unknown) => void
  onAccessDenied?: () => void
  readOnly?: boolean
  userId: string
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  documentId,
  initialData,
  onDataChange,
  onAccessDenied,
  readOnly = false,
  userId,
}) => {
  const spreadRef = useRef<GC.Spread.Sheets.Workbook | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  const serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

  const handleCollaborativeError = useCallback(
    (error: Error & { code?: number }) => {
      if (error.code === 1003) {
        setAccessDenied(true)
        onAccessDenied?.()
      }
    },
    [onAccessDenied]
  )

  const { isConnected, isLoading, error, errorCode, bindWorkbook } = useSpreadCollaboration({
    documentId,
    serverUrl,
    onError: handleCollaborativeError,
    userId,
  })

  const loadSnapshot = useCallback((snapshot: SnapshotData, spread?: GC.Spread.Sheets.Workbook) => {
    const targetSpread = spread || spreadRef.current
    if (!snapshot || !targetSpread) return

    if (snapshot.sheets || snapshot.activeSheetIndex) {
      targetSpread.fromJSON(snapshot as unknown as GC.Spread.Sheets.Workbook)
      return
    }

    const sheet = targetSpread.getActiveSheet()
    sheet.suspendPaint()

    if (snapshot.rowCount) sheet.setRowCount(snapshot.rowCount)
    if (snapshot.columnCount) sheet.setColumnCount(snapshot.columnCount)

    if (snapshot.data) {
      snapshot.data.forEach((cell: CellData) => {
        sheet.setValue(cell.row, cell.col, cell.value)
      })
    }

    if (snapshot.formulas) {
      Object.entries(snapshot.formulas).forEach(([key, formula]: [string, string]) => {
        const [row, col] = key.split(',').map(Number)
        sheet.setFormula(row, col, formula)
      })
    }

    sheet.resumePaint()
  }, [])

  const handleWorkbookInitialized = useCallback(
    (spread: GC.Spread.Sheets.Workbook) => {
      spreadRef.current = spread
      setIsInitialized(true)

      if (!readOnly) {
        bindWorkbook(spread)
      }

      if (initialData) {
        loadSnapshot(initialData, spread)
      }

      if (onDataChange) {
        spread.bind(GC.Spread.Sheets.Events.CellChanged, (sender: GC.Spread.Sheets.Workbook) => {
          const sheet = sender.getActiveSheet()
          const data = sheet.toJSON()
          onDataChange(data)
        })
      }
    },
    [bindWorkbook, initialData, onDataChange, readOnly, loadSnapshot]
  )

  useEffect(() => {
    if (isInitialized && initialData && !isConnected) {
      loadSnapshot(initialData)
    }
  }, [initialData, isInitialized, loadSnapshot, isConnected])

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

  if (accessDenied || errorCode === 1003) {
    return (
      <div style={errorStyles}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>无权访问此文档</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            您没有权限访问此文档，请联系文档所有者添加您的访问权限。
          </div>
        </div>
      </div>
    )
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
