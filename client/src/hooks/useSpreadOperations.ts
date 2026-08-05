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
  loadDatabaseData: () => void
  applyDropdownToSelection: () => void
  mergeSelection: () => void
  unmergeSelection: () => void
  setSelectionHorizontalAlign: (align: GC.Spread.Sheets.HorizontalAlign) => void
  setSelectionVerticalAlign: (align: GC.Spread.Sheets.VerticalAlign) => void
  setSelectionWordWrap: (enabled: boolean) => void
  increaseSelectionIndent: () => void
  decreaseSelectionIndent: () => void
  lockSelection: () => void
  unlockSelection: () => void
  protectSheet: () => void
  unprotectSheet: () => void
  setSelectedRowHeight: (height: number) => void
  setSelectedColumnWidth: (width: number) => void
  hideSelectedRows: () => void
  showAllRows: () => void
  hideSelectedColumns: () => void
  showAllColumns: () => void
  hasContent: () => boolean
  importExcel: (file: File) => Promise<void>
  exportExcel: (fileName?: string) => Promise<void>
  toJSON: () => object
  fromJSON: (data: object) => void
}

const MOCK_DATABASE_DATA = [
  ['订单号', '客户', '状态', '金额', '负责人', '锁定字段'],
  ['SO-2026-001', '北京天启科技', '待处理', 12800, '张三', '系统生成'],
  ['SO-2026-002', '上海云杉贸易', '处理中', 8600, '李四', '系统生成'],
  ['SO-2026-003', '深圳星河制造', '已完成', 21300, '王五', '系统生成'],
  ['SO-2026-004', '杭州澄明数据', '已取消', 5200, '赵六', '系统生成'],
]

const ORDER_STATUS_OPTIONS = ['待处理', '处理中', '已完成', '已取消']
const PROTECTION_PASSWORD = 'spread-demo'

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

  const getSelectionRange = () => {
    const sheet = getActiveSheet()
    if (!sheet) return { row: 0, col: 0, rowCount: 1, colCount: 1 }

    const selections = sheet.getSelections()
    if (selections && selections.length > 0) {
      const selection = selections[0]
      const rowCount = selection.rowCount > 0 ? selection.rowCount : sheet.getRowCount()
      const colCount = selection.colCount > 0 ? selection.colCount : sheet.getColumnCount()

      return {
        row: Math.max(0, selection.row),
        col: Math.max(0, selection.col),
        rowCount,
        colCount,
      }
    }

    return { row: 0, col: 0, rowCount: 1, colCount: 1 }
  }

  const isSheetProtected = (sheet: GC.Spread.Sheets.Worksheet) => {
    return Boolean(sheet.options.isProtected || sheet.hasPassword())
  }

  const ensureSheetEditable = (sheet: GC.Spread.Sheets.Worksheet, action: string) => {
    if (isSheetProtected(sheet)) {
      throw new Error(`工作表已保护，不能${action}。请先取消保护。`)
    }
  }

  const applyProtectionOptions = (sheet: GC.Spread.Sheets.Worksheet) => {
    sheet.options.protectionOptions = {
      allowSelectLockedCells: true,
      allowSelectUnlockedCells: true,
      allowSort: false,
      allowFilter: false,
      allowEditObjects: false,
      allowResizeRows: false,
      allowResizeColumns: false,
      allowDragInsertRows: false,
      allowDragInsertColumns: false,
      allowInsertRows: false,
      allowInsertColumns: false,
      allowDeleteRows: false,
      allowDeleteColumns: false,
      allowOutlineRows: false,
      allowOutlineColumns: false,
    }
  }

  const protectSheetInternal = (sheet: GC.Spread.Sheets.Worksheet) => {
    applyProtectionOptions(sheet)
    sheet.options.isProtected = true
    sheet.protect(PROTECTION_PASSWORD)
  }

  const unprotectSheetInternal = (sheet: GC.Spread.Sheets.Worksheet) => {
    if (sheet.hasPassword()) {
      sheet.unprotect(PROTECTION_PASSWORD)
    }
    sheet.options.isProtected = false
  }

  const runWithSheetUnprotected = (
    sheet: GC.Spread.Sheets.Worksheet,
    operation: () => void,
    shouldRestoreProtection = isSheetProtected(sheet)
  ) => {
    if (shouldRestoreProtection) {
      unprotectSheetInternal(sheet)
    }
    operation()
    if (shouldRestoreProtection) {
      protectSheetInternal(sheet)
    }
  }

  const getSelectionStyle = () => {
    const sheet = getActiveSheet()
    if (!sheet) return null

    const { row, col } = getSelectionRange()
    return sheet.getStyle(row, col, GC.Spread.Sheets.SheetArea.viewport)
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
      ensureSheetEditable(sheet, '插入行')
      const { row } = getSelectedPosition()
      const insertRow = position === 'above' ? row : row + 1
      sheet.addRows(insertRow, 1)
    },
    addColumn: (position: 'left' | 'right') => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '插入列')
      const { col } = getSelectedPosition()
      const insertCol = position === 'left' ? col : col + 1
      sheet.addColumns(insertCol, 1)
    },
    deleteRow: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '删除行')
      const { row } = getSelectedPosition()
      sheet.deleteRows(row, 1)
    },
    deleteColumn: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '删除列')
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
    loadDatabaseData: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      sheet.suspendPaint()
      unprotectSheetInternal(sheet)
      sheet.setRowCount(30)
      sheet.setColumnCount(10)
      sheet.clear(
        0,
        0,
        sheet.getRowCount(),
        sheet.getColumnCount(),
        GC.Spread.Sheets.SheetArea.viewport,
        GC.Spread.Sheets.StorageType.style
      )
      sheet.setArray(0, 0, MOCK_DATABASE_DATA)
      sheet.setColumnWidth(0, 120)
      sheet.setColumnWidth(1, 150)
      sheet.setColumnWidth(2, 110)
      sheet.setColumnWidth(3, 100)
      sheet.setColumnWidth(4, 100)
      sheet.setColumnWidth(5, 120)
      sheet.setRowHeight(0, 32)
      sheet
        .getRange(0, 0, sheet.getRowCount(), sheet.getColumnCount())
        .locked(false)
        .backColor(undefined)
      sheet.getRange(0, 0, 1, 6).font('bold 13px Arial').backColor('#eef2ff')
      sheet.getRange(1, 3, 4, 1).formatter('#,##0')

      const comboBox = new GC.Spread.Sheets.CellTypes.ComboBox()
        .items(ORDER_STATUS_OPTIONS)
        .editable(false)
        .maxDropDownItems(4)
      sheet.getRange(1, 2, MOCK_DATABASE_DATA.length - 1, 1).cellType(comboBox)
      sheet.getRange(0, 0, 1, 6).locked(true)
      sheet
        .getRange(1, 5, MOCK_DATABASE_DATA.length - 1, 1)
        .locked(true)
        .backColor('#f3f4f6')
      protectSheetInternal(sheet)
      sheet.resumePaint()
    },
    applyDropdownToSelection: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      const { row, col, rowCount, colCount } = getSelectionRange()
      const comboBox = new GC.Spread.Sheets.CellTypes.ComboBox()
        .items(ORDER_STATUS_OPTIONS)
        .editable(false)
        .maxDropDownItems(4)
      runWithSheetUnprotected(sheet, () => {
        sheet.getRange(row, col, rowCount, colCount).cellType(comboBox).locked(false)
      })
    },
    mergeSelection: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '合并单元格')
      const { row, col, rowCount, colCount } = getSelectionRange()
      if (rowCount <= 1 && colCount <= 1) {
        throw new Error('请选择至少两个单元格再合并')
      }

      sheet.addSpan(row, col, rowCount, colCount, GC.Spread.Sheets.SheetArea.viewport)
    },
    unmergeSelection: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '取消合并')
      const { row, col, rowCount, colCount } = getSelectionRange()
      const spans = sheet.getSpans(
        new GC.Spread.Sheets.Range(row, col, rowCount, colCount),
        GC.Spread.Sheets.SheetArea.viewport
      )

      if (!spans.length) {
        throw new Error('当前选区没有合并单元格')
      }

      spans.forEach(span => {
        sheet.removeSpan(span.row, span.col, GC.Spread.Sheets.SheetArea.viewport)
      })
    },
    setSelectionHorizontalAlign: (align: GC.Spread.Sheets.HorizontalAlign) => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '设置水平对齐')
      const { row, col, rowCount, colCount } = getSelectionRange()
      sheet.getRange(row, col, rowCount, colCount).hAlign(align)
    },
    setSelectionVerticalAlign: (align: GC.Spread.Sheets.VerticalAlign) => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '设置垂直对齐')
      const { row, col, rowCount, colCount } = getSelectionRange()
      sheet.getRange(row, col, rowCount, colCount).vAlign(align)
    },
    setSelectionWordWrap: (enabled: boolean) => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '设置自动换行')
      const { row, col, rowCount, colCount } = getSelectionRange()
      sheet.getRange(row, col, rowCount, colCount).wordWrap(enabled)
    },
    increaseSelectionIndent: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '增加缩进')
      const { row, col, rowCount, colCount } = getSelectionRange()
      const currentIndent = getSelectionStyle()?.textIndent || 0
      sheet.getRange(row, col, rowCount, colCount).textIndent(currentIndent + 1)
    },
    decreaseSelectionIndent: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      ensureSheetEditable(sheet, '减少缩进')
      const { row, col, rowCount, colCount } = getSelectionRange()
      const currentIndent = getSelectionStyle()?.textIndent || 0
      sheet.getRange(row, col, rowCount, colCount).textIndent(Math.max(0, currentIndent - 1))
    },
    lockSelection: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      const { row, col, rowCount, colCount } = getSelectionRange()
      const wasProtected = isSheetProtected(sheet)
      runWithSheetUnprotected(
        sheet,
        () => {
          if (!wasProtected) {
            sheet.getRange(0, 0, sheet.getRowCount(), sheet.getColumnCount()).locked(false)
          }
          sheet.getRange(row, col, rowCount, colCount).locked(true).backColor('#f3f4f6')
        },
        true
      )
    },
    unlockSelection: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      const { row, col, rowCount, colCount } = getSelectionRange()
      runWithSheetUnprotected(sheet, () => {
        sheet.getRange(row, col, rowCount, colCount).locked(false).backColor(undefined)
      })
    },
    protectSheet: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      protectSheetInternal(sheet)
    },
    unprotectSheet: () => {
      const sheet = getActiveSheet()
      if (!sheet) return

      unprotectSheetInternal(sheet)
    },
    setSelectedRowHeight: (height: number) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '修改行高')

      const { row, rowCount } = getSelectionRange()
      for (let index = 0; index < rowCount; index += 1) {
        sheet.setRowHeight(row + index, height)
      }
    },
    setSelectedColumnWidth: (width: number) => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '修改列宽')

      const { col, colCount } = getSelectionRange()
      for (let index = 0; index < colCount; index += 1) {
        sheet.setColumnWidth(col + index, width)
      }
    },
    hideSelectedRows: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '隐藏行')

      const { row, rowCount } = getSelectionRange()
      for (let index = 0; index < rowCount; index += 1) {
        sheet.setRowVisible(row + index, false)
      }
    },
    showAllRows: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '显示行')

      for (let row = 0; row < sheet.getRowCount(); row += 1) {
        sheet.setRowVisible(row, true)
      }
    },
    hideSelectedColumns: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '隐藏列')

      const { col, colCount } = getSelectionRange()
      for (let index = 0; index < colCount; index += 1) {
        sheet.setColumnVisible(col + index, false)
      }
    },
    showAllColumns: () => {
      const sheet = getActiveSheet()
      if (!sheet) return
      ensureSheetEditable(sheet, '显示列')

      for (let col = 0; col < sheet.getColumnCount(); col += 1) {
        sheet.setColumnVisible(col, true)
      }
    },
    hasContent: () => {
      const workbook = getWorkbook()
      if (!workbook) return false

      for (let s = 0; s < workbook.getSheetCount(); s += 1) {
        const sheet = workbook.getSheet(s)
        if (!sheet) continue

        const rowCount = sheet.getRowCount()
        const colCount = sheet.getColumnCount()

        // Check cells for values
        for (let r = 0; r < Math.min(rowCount, 100); r += 1) {
          for (let c = 0; c < Math.min(colCount, 50); c += 1) {
            const value = sheet.getValue(r, c)
            if (value !== null && value !== undefined && value !== '') {
              return true
            }
          }
        }

      }

      return false
    },
    importExcel: (file: File) => {
      console.log('importExcel called, file:', file)
      const workbook = getWorkbookOrThrow()

      return new Promise<void>((resolve, reject) => {
        workbook.import(
          file,
          () => {
            console.log('import success')
            resolve()
          },
          (error: unknown) => {
            console.error('Import error:', error)
            const excelError = error as { errorMessage?: string }
            reject(
              error instanceof Error ? error : new Error(excelError?.errorMessage || '导入失败')
            )
          },
          {
            // openMode: GC.Spread.Sheets.OpenMode.normal,
            // includeStyles: true,
            // includeFormulas: true,
          }
        )
      })
    },
    exportExcel: (fileName = 'spreadsheet.xlsx') => {
      const workbook = getWorkbookOrThrow()
      const normalizedFileName = normalizeExcelFileName(fileName)

      return new Promise<void>((resolve, reject) => {
        workbook.export(
          (blob: Blob) => {
            downloadBlob(blob, normalizedFileName)
            resolve()
          },
          (error: unknown) => {
            const excelError = error as { errorMessage?: string }
            reject(
              error instanceof Error ? error : new Error(excelError?.errorMessage || '导出失败')
            )
          },
          { fileType: GC.Spread.Sheets.FileType.excel }
        )
      })
    },
    toJSON: () => {
      const workbook = getWorkbookOrThrow()
      return workbook.toJSON()
    },
    fromJSON: (data: object) => {
      const workbook = getWorkbookOrThrow()
      workbook.fromJSON(data)
    },
  }
}
