import GC from '@grapecity-software/spread-sheets'
import * as ExcelIO from '@grapecity-software/spread-excelio'

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
  importExcel: (file: File) => Promise<void>
  exportExcel: (fileName?: string) => Promise<void>
}

export const createSpreadOperations = (
  getWorkbook: () => GC.Spread.Sheets.Workbook | null
): SpreadOperations => {
  const excelIO = new ExcelIO.IO()

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

  const getWorkbookOrThrow = () => {
    const workbook = getWorkbook()
    if (!workbook) {
      throw new Error('表格尚未初始化')
    }
    return workbook
  }

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const normalizeExcelFileName = (fileName: string) => {
    const safeName = fileName.trim().replace(/[\\/:*?"<>|]/g, '_') || 'spreadsheet'
    return safeName.toLowerCase().endsWith('.xlsx') ? safeName : `${safeName}.xlsx`
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
    importExcel: (file: File) => {
      const workbook = getWorkbookOrThrow()

      return new Promise<void>((resolve, reject) => {
        excelIO.open(
          file,
          (json: object) => {
            workbook.fromJSON(json)
            workbook.repaint()
            resolve()
          },
          (error: unknown) => {
            const excelError = error as { errorMessage?: string }
            reject(error instanceof Error ? error : new Error(excelError?.errorMessage || '导入失败'))
          }
        )
      })
    },
    exportExcel: (fileName = 'spreadsheet.xlsx') => {
      const workbook = getWorkbookOrThrow()
      const normalizedFileName = normalizeExcelFileName(fileName)

      return new Promise<void>((resolve, reject) => {
        excelIO.save(
          workbook.toJSON(),
          (blob: Blob) => {
            downloadBlob(blob, normalizedFileName)
            resolve()
          },
          (error: unknown) => {
            const excelError = error as { errorMessage?: string }
            reject(error instanceof Error ? error : new Error(excelError?.errorMessage || '导出失败'))
          },
          {
            xlsxStrictMode: false,
          }
        )
      })
    },
  }
}
