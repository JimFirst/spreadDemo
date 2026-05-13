import GC from '@grapecity-software/spread-sheets'

export interface SpreadOperations {
  addRow: (position: 'above' | 'below') => void
  addColumn: (position: 'left' | 'right') => void
  deleteRow: () => void
  deleteColumn: () => void
  freezeRow: (count: number) => void
  freezeColumn: (count: number) => void
  freezeTrailingRow: (count: number, stickToEdge?: boolean) => void
  freezeTrailingColumn: (count: number, stickToEdge?: boolean) => void
  unfreezeAll: () => void
}

export const createSpreadOperations = (
  getWorkbook: () => GC.Spread.Sheets.Workbook | null
): SpreadOperations => {
  const getActiveSheet = () => {
    const activeSheet = getWorkbook()?.getActiveSheet() || null
    if (activeSheet) {
      activeSheet.options.frozenlineColor = 'red'
    }
    return activeSheet
  }

  const getSelectedPosition = () => {
    const sheet = getActiveSheet()
    if (!sheet) return { row: 0, col: 0 }
    const selections = sheet.getSelections()
    if (selections && selections.length > 0) {
      const sel = selections[0]
      return { row: Math.max(0, sel.row), col: Math.max(0, sel.col) }
    }
    return { row: 0, col: 0 }
  }

  return {
    addRow: (position: 'above' | 'below') => {
      const sheet = getActiveSheet()
      if (!sheet) return
      const { row } = getSelectedPosition()
      const insertRow = position === 'above' ? row : row + 1
      sheet.addRows(insertRow, 1)
    },
    addColumn: (position: 'left' | 'right') => {
      const sheet = getActiveSheet()
      if (!sheet) return
      const { col } = getSelectedPosition()
      const insertCol = position === 'left' ? col : col + 1
      sheet.addColumns(insertCol, 1)
    },
    deleteRow: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      const { row } = getSelectedPosition()
      sheet.deleteRows(row, 1)
    },
    deleteColumn: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      const { col } = getSelectedPosition()
      sheet.deleteColumns(col, 1)
    },
    freezeRow: (count: number) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      sheet.frozenRowCount(count)
    },
    freezeColumn: (count: number) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      sheet.frozenColumnCount(count)
    },
    freezeTrailingRow: (count: number, stickToEdge: boolean = true) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      sheet.frozenTrailingRowCount(count, stickToEdge)
    },
    freezeTrailingColumn: (count: number, stickToEdge: boolean = true) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      sheet.frozenTrailingColumnCount(count, stickToEdge)
    },
    unfreezeAll: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      sheet.frozenRowCount(0)
      sheet.frozenColumnCount(0)
      sheet.frozenTrailingRowCount(0)
      sheet.frozenTrailingColumnCount(0)
    },
  }
}
