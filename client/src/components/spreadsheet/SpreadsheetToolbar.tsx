import React, { useRef, useState } from 'react'
import { Button, Space, Tooltip, Dropdown, message } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { SpreadsheetEditorRef } from './SpreadsheetEditor'

interface SpreadsheetToolbarProps {
  spreadsheetRef: React.RefObject<SpreadsheetEditorRef | null>
  disabled?: boolean
  fileName?: string
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  spreadsheetRef,
  disabled = false,
  fileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleFreezeRow = (count: number) => {
    spreadsheetRef.current?.freezeRow(count)
    message.success(`已冻结顶部 ${count} 行`)
  }

  const handleFreezeColumn = (count: number) => {
    spreadsheetRef.current?.freezeColumn(count)
    message.success(`已冻结左侧 ${count} 列`)
  }

  const handleFreezeTrailingRow = (count: number) => {
    spreadsheetRef.current?.freezeTrailingRow(count)
    message.success(`已冻结底部 ${count} 尾随行`)
  }

  const handleFreezeTrailingColumn = (count: number) => {
    spreadsheetRef.current?.freezeTrailingColumn(count)
    message.success(`已冻结右侧 ${count} 尾随列`)
  }

  const handleUnfreeze = () => {
    spreadsheetRef.current?.unfreezeAll()
    message.success('已解除所有冻结')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setImporting(true)
      if (!spreadsheetRef.current) {
        throw new Error('表格尚未初始化')
      }
      if (typeof spreadsheetRef.current.importExcel !== 'function') {
        throw new Error('表格导入能力尚未初始化')
      }
      await spreadsheetRef.current.importExcel(file)
      message.success('Excel 导入成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Excel 导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      if (!spreadsheetRef.current) {
        throw new Error('表格尚未初始化')
      }
      if (typeof spreadsheetRef.current.exportExcel !== 'function') {
        throw new Error('表格导出能力尚未初始化')
      }
      await spreadsheetRef.current.exportExcel(fileName)
      message.success('Excel 导出成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Excel 导出失败')
    } finally {
      setExporting(false)
    }
  }

  const freezeRowMenuItems: MenuProps['items'] = [
    { key: 1, label: '冻结 1 行', onClick: () => handleFreezeRow(1) },
    { key: 2, label: '冻结 2 行', onClick: () => handleFreezeRow(2) },
    { key: 3, label: '冻结 3 行', onClick: () => handleFreezeRow(3) },
    { key: 4, label: '冻结 5 行', onClick: () => handleFreezeRow(5) },
  ]

  const freezeColumnMenuItems: MenuProps['items'] = [
    { key: 1, label: '冻结 1 列', onClick: () => handleFreezeColumn(1) },
    { key: 2, label: '冻结 2 列', onClick: () => handleFreezeColumn(2) },
    { key: 3, label: '冻结 3 列', onClick: () => handleFreezeColumn(3) },
    { key: 4, label: '冻结 5 列', onClick: () => handleFreezeColumn(5) },
  ]

  const freezeTrailingRowMenuItems: MenuProps['items'] = [
    { key: 1, label: '冻结 1 尾随行', onClick: () => handleFreezeTrailingRow(1) },
    { key: 2, label: '冻结 2 尾随行', onClick: () => handleFreezeTrailingRow(2) },
    { key: 3, label: '冻结 3 尾随行', onClick: () => handleFreezeTrailingRow(3) },
  ]

  const freezeTrailingColumnMenuItems: MenuProps['items'] = [
    { key: 1, label: '冻结 1 尾随列', onClick: () => handleFreezeTrailingColumn(1) },
    { key: 2, label: '冻结 2 尾随列', onClick: () => handleFreezeTrailingColumn(2) },
    { key: 3, label: '冻结 3 尾随列', onClick: () => handleFreezeTrailingColumn(3) },
  ]

  return (
    <Space wrap>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportChange}
        style={{ display: 'none' }}
      />
      <Tooltip title="导入外部 Excel 并呈现在当前表格">
        <Button
          icon={<UploadOutlined />}
          onClick={handleImportClick}
          disabled={disabled}
          loading={importing}
        >
          导入
        </Button>
      </Tooltip>
      <Tooltip title="导出当前表格为 Excel">
        <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
          导出
        </Button>
      </Tooltip>

      <div style={{ width: 1, height: 24, background: '#d9d9d9', margin: '0 8px' }} />

      <Tooltip title="在上方插入行">
        <Button
          icon={<PlusOutlined />}
          onClick={() => spreadsheetRef.current?.addRow('above')}
          disabled={disabled}
        >
          上行
        </Button>
      </Tooltip>
      <Tooltip title="在下方插入行">
        <Button
          icon={<PlusOutlined />}
          onClick={() => spreadsheetRef.current?.addRow('below')}
          disabled={disabled}
        >
          下行
        </Button>
      </Tooltip>
      <Tooltip title="在左侧插入列">
        <Button
          icon={<PlusOutlined />}
          onClick={() => spreadsheetRef.current?.addColumn('left')}
          disabled={disabled}
        >
          左列
        </Button>
      </Tooltip>
      <Tooltip title="在右侧插入列">
        <Button
          icon={<PlusOutlined />}
          onClick={() => spreadsheetRef.current?.addColumn('right')}
          disabled={disabled}
        >
          右列
        </Button>
      </Tooltip>
      <Tooltip title="删除当前行">
        <Button
          icon={<DeleteOutlined />}
          onClick={() => spreadsheetRef.current?.deleteRow()}
          disabled={disabled}
        >
          删行
        </Button>
      </Tooltip>
      <Tooltip title="删除当前列">
        <Button
          icon={<DeleteOutlined />}
          onClick={() => spreadsheetRef.current?.deleteColumn()}
          disabled={disabled}
        >
          删列
        </Button>
      </Tooltip>

      <div style={{ width: 1, height: 24, background: '#d9d9d9', margin: '0 8px' }} />

      <Dropdown menu={{ items: freezeRowMenuItems }} trigger={['click']}>
        <Button icon={<LockOutlined />} disabled={disabled}>
          冻结顶部行
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: freezeColumnMenuItems }} trigger={['click']}>
        <Button icon={<LockOutlined />} disabled={disabled}>
          冻结左侧列
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: freezeTrailingRowMenuItems }} trigger={['click']}>
        <Button icon={<LockOutlined />} disabled={disabled}>
          冻结尾随行
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: freezeTrailingColumnMenuItems }} trigger={['click']}>
        <Button icon={<LockOutlined />} disabled={disabled}>
          冻结尾随列
        </Button>
      </Dropdown>
      <Tooltip title="解除所有冻结">
        <Button icon={<UnlockOutlined />} onClick={handleUnfreeze} disabled={disabled}>
          解冻
        </Button>
      </Tooltip>
    </Space>
  )
}
