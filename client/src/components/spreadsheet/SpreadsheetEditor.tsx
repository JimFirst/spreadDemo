import GC from '@grapecity-software/spread-sheets'
import { SpreadSheets, Worksheet } from '@grapecity-software/spread-sheets-react'
import '@grapecity-software/spread-sheets/styles/gc.spread.sheets.excel2013white.css'
import { useDocument } from '@/stores/DocumentContext'
import './SpreadsheetEditor.scss'
// 功能模块，供AI调用
import '@grapecity-software/spread-sheets-shapes'
import '@grapecity-software/spread-sheets-charts'
import '@grapecity-software/spread-sheets-datacharts-addon'
import '@grapecity-software/spread-sheets-slicers'
import '@grapecity-software/spread-sheets-print'
import '@grapecity-software/spread-sheets-barcode'
import '@grapecity-software/spread-sheets-pdf'
import '@grapecity-software/spread-sheets-pivot-addon'
import '@grapecity-software/spread-sheets-tablesheet'

import '@grapecity-software/spread-sheets-ganttsheet'
import '@grapecity-software/spread-sheets-reportsheet-addon'
import '@grapecity-software/spread-sheets-formula-panel'
import '@grapecity-software/spread-sheets-io'

export const SpreadsheetEditor = () => {
  const { setWorkbook } = useDocument()

  const handleWorkbookInitialized = (spread: GC.Spread.Sheets.Workbook) => {
    setWorkbook(spread)
  }

  return (
    <div className="spreadsheet-editor">
      <SpreadSheets
        backColor="aliceblue"
        hostStyle={{ width: '100%', height: '1000px' }}
        workbookInitialized={handleWorkbookInitialized}
      >
        <Worksheet name="Sheet1" />
      </SpreadSheets>
    </div>
  )
}
