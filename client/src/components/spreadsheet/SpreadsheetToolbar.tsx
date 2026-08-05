import { useRef, useState, useMemo } from 'react'
import { Button, Space, Tooltip, Dropdown, message } from 'antd'
import GC from '@grapecity-software/spread-sheets'
import {
  DatabaseOutlined,
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  UploadOutlined,
  DownloadOutlined,
  CloudOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { createSpreadOperations, SpreadOperations } from '@/hooks/useSpreadOperations'

interface SpreadsheetToolbarProps {
  getWorkbook: () => GC.Spread.Sheets.Workbook | null
  disabled?: boolean
  fileName?: string
  initCollaboration?: () => void
  isCollaborating?: boolean
  onSave?: () => void
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  getWorkbook,
  disabled = false,
  fileName,
  initCollaboration,
  isCollaborating = false,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const spreadsheet = useMemo(() => createSpreadOperations(getWorkbook), [getWorkbook])

  const runOperation = (
    operation: (spreadsheet: SpreadOperations) => void,
    successMessage: string
  ) => {
    try {
      if (!spreadsheet) {
        throw new Error('表格尚未初始化')
      }
      operation(spreadsheet)
      message.success(successMessage)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleFreezeRow = (count: number) => {
    spreadsheet?.freezeRow(count)
    message.success(`已冻结顶部 ${count} 行`)
  }

  const handleFreezeColumn = (count: number) => {
    spreadsheet?.freezeColumn(count)
    message.success(`已冻结左侧 ${count} 列`)
  }

  const handleFreezeTrailingRow = (count: number) => {
    spreadsheet?.freezeTrailingRow(count)
    message.success(`已冻结底部 ${count} 尾随行`)
  }

  const handleFreezeTrailingColumn = (count: number) => {
    spreadsheet?.freezeTrailingColumn(count)
    message.success(`已冻结右侧 ${count} 尾随列`)
  }

  const handleUnfreeze = () => {
    spreadsheet?.unfreezeAll()
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
      if (!spreadsheet) {
        throw new Error('表格尚未初始化')
      }
      if (typeof spreadsheet.importExcel !== 'function') {
        throw new Error('表格导入能力尚未初始化')
      }
      await spreadsheet.importExcel(file)
      message.success('Excel 导入成功')
    } catch (error) {
      console.log(error)
      message.error(error instanceof Error ? error.message : 'Excel 导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      if (!spreadsheet) {
        throw new Error('表格尚未初始化')
      }
      if (typeof spreadsheet.exportExcel !== 'function') {
        throw new Error('表格导出能力尚未初始化')
      }
      await spreadsheet.exportExcel(fileName)
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

  const cellMenuItems: MenuProps['items'] = [
    {
      key: 'dropdown',
      label: '选区设置状态下拉',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.applyDropdownToSelection(), '已为选区设置下拉'),
    },
    {
      key: 'merge',
      label: '合并选区',
      onClick: () => runOperation(spreadsheet => spreadsheet.mergeSelection(), '已合并选区'),
    },
    {
      key: 'unmerge',
      label: '取消合并',
      onClick: () => runOperation(spreadsheet => spreadsheet.unmergeSelection(), '已取消合并'),
    },
    {
      key: 'lock',
      label: '锁定选区',
      onClick: () => runOperation(spreadsheet => spreadsheet.lockSelection(), '已锁定选区'),
    },
    {
      key: 'unlock',
      label: '解锁选区',
      onClick: () => runOperation(spreadsheet => spreadsheet.unlockSelection(), '已解锁选区'),
    },
  ]

  const layoutMenuItems: MenuProps['items'] = [
    {
      key: 'h-left',
      label: '水平左对齐',
      onClick: () =>
        runOperation(
          spreadsheet =>
            spreadsheet.setSelectionHorizontalAlign(GC.Spread.Sheets.HorizontalAlign.left),
          '已设置水平左对齐'
        ),
    },
    {
      key: 'h-center',
      label: '水平居中',
      onClick: () =>
        runOperation(
          spreadsheet =>
            spreadsheet.setSelectionHorizontalAlign(GC.Spread.Sheets.HorizontalAlign.center),
          '已设置水平居中'
        ),
    },
    {
      key: 'h-right',
      label: '水平右对齐',
      onClick: () =>
        runOperation(
          spreadsheet =>
            spreadsheet.setSelectionHorizontalAlign(GC.Spread.Sheets.HorizontalAlign.right),
          '已设置水平右对齐'
        ),
    },
    {
      type: 'divider',
    },
    {
      key: 'v-top',
      label: '垂直置顶',
      onClick: () =>
        runOperation(
          spreadsheet => spreadsheet.setSelectionVerticalAlign(GC.Spread.Sheets.VerticalAlign.top),
          '已设置垂直置顶'
        ),
    },
    {
      key: 'v-center',
      label: '垂直居中',
      onClick: () =>
        runOperation(
          spreadsheet =>
            spreadsheet.setSelectionVerticalAlign(GC.Spread.Sheets.VerticalAlign.center),
          '已设置垂直居中'
        ),
    },
    {
      key: 'v-bottom',
      label: '垂直置底',
      onClick: () =>
        runOperation(
          spreadsheet =>
            spreadsheet.setSelectionVerticalAlign(GC.Spread.Sheets.VerticalAlign.bottom),
          '已设置垂直置底'
        ),
    },
    {
      type: 'divider',
    },
    {
      key: 'wrap-on',
      label: '开启自动换行',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.setSelectionWordWrap(true), '已开启自动换行'),
    },
    {
      key: 'wrap-off',
      label: '关闭自动换行',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.setSelectionWordWrap(false), '已关闭自动换行'),
    },
    {
      key: 'indent-increase',
      label: '增加缩进',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.increaseSelectionIndent(), '已增加缩进'),
    },
    {
      key: 'indent-decrease',
      label: '减少缩进',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.decreaseSelectionIndent(), '已减少缩进'),
    },
  ]

  const rowColumnMenuItems: MenuProps['items'] = [
    {
      key: 'row-height',
      label: '选中行高度 36',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.setSelectedRowHeight(36), '已设置选中行高度'),
    },
    {
      key: 'column-width',
      label: '选中列宽度 140',
      onClick: () =>
        runOperation(spreadsheet => spreadsheet.setSelectedColumnWidth(140), '已设置选中列宽度'),
    },
    {
      key: 'hide-rows',
      label: '隐藏选中行',
      onClick: () => runOperation(spreadsheet => spreadsheet.hideSelectedRows(), '已隐藏选中行'),
    },
    {
      key: 'show-rows',
      label: '显示所有行',
      onClick: () => runOperation(spreadsheet => spreadsheet.showAllRows(), '已显示所有行'),
    },
    {
      key: 'hide-columns',
      label: '隐藏选中列',
      onClick: () => runOperation(spreadsheet => spreadsheet.hideSelectedColumns(), '已隐藏选中列'),
    },
    {
      key: 'show-columns',
      label: '显示所有列',
      onClick: () => runOperation(spreadsheet => spreadsheet.showAllColumns(), '已显示所有列'),
    },
    { type: 'divider' },
  ]

  const protectionMenuItems: MenuProps['items'] = [
    {
      key: 'protect',
      label: '保护工作表',
      onClick: () => runOperation(spreadsheet => spreadsheet.protectSheet(), '已保护工作表'),
    },
    {
      key: 'unprotect',
      label: '取消保护',
      onClick: () => runOperation(spreadsheet => spreadsheet.unprotectSheet(), '已取消保护'),
    },
  ]

  return (
    <Space wrap>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={handleImportChange}
        style={{ display: 'none' }}
      />
      <Tooltip title="导入外部 Excel 并呈现在当前表格">
        <Button
          icon={<UploadOutlined />}
          onClick={handleImportClick}
          disabled={disabled || isCollaborating}
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
      {!isCollaborating && onSave && (
        <Tooltip title="保存当前表格到服务器">
          <Button icon={<SaveOutlined />} onClick={onSave}>
            保存
          </Button>
        </Tooltip>
      )}

      <div style={{ width: 1, height: 24, background: '#d9d9d9', margin: '0 8px' }} />

      <Tooltip title="加载模拟数据库数据">
        <Button
          icon={<DatabaseOutlined />}
          onClick={() =>
            runOperation(spreadsheet => spreadsheet.loadDatabaseData(), '已加载模拟数据库数据')
          }
          disabled={disabled}
        >
          加载数据
        </Button>
      </Tooltip>
      {initCollaboration && (
        <Tooltip title={isCollaborating ? '已连接协同' : '开启协同编辑'}>
          <Button
            icon={<CloudOutlined />}
            onClick={initCollaboration}
            disabled={disabled || isCollaborating}
            type={isCollaborating ? 'primary' : 'default'}
          >
            {isCollaborating ? '协同中' : '协同'}
          </Button>
        </Tooltip>
      )}
      <Dropdown menu={{ items: cellMenuItems }} trigger={['click']}>
        <Button disabled={disabled}>单元格</Button>
      </Dropdown>
      <Dropdown menu={{ items: layoutMenuItems }} trigger={['click']}>
        <Button disabled={disabled}>内容布局</Button>
      </Dropdown>
      <Dropdown menu={{ items: rowColumnMenuItems }} trigger={['click']}>
        <Button disabled={disabled}>行列控制</Button>
      </Dropdown>
      <Dropdown menu={{ items: protectionMenuItems }} trigger={['click']}>
        <Button icon={<LockOutlined />} disabled={disabled}>
          保护
        </Button>
      </Dropdown>

      <div style={{ width: 1, height: 24, background: '#d9d9d9', margin: '0 8px' }} />

      <Tooltip title="在上方插入行">
        <Button
          icon={<PlusOutlined />}
          onClick={() => runOperation(spreadsheet => spreadsheet.addRow('above'), '已在上方插入行')}
          disabled={disabled}
        >
          上行
        </Button>
      </Tooltip>
      <Tooltip title="在下方插入行">
        <Button
          icon={<PlusOutlined />}
          onClick={() => runOperation(spreadsheet => spreadsheet.addRow('below'), '已在下方插入行')}
          disabled={disabled}
        >
          下行
        </Button>
      </Tooltip>
      <Tooltip title="在左侧插入列">
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            runOperation(spreadsheet => spreadsheet.addColumn('left'), '已在左侧插入列')
          }
          disabled={disabled}
        >
          左列
        </Button>
      </Tooltip>
      <Tooltip title="在右侧插入列">
        <Button
          icon={<PlusOutlined />}
          onClick={() =>
            runOperation(spreadsheet => spreadsheet.addColumn('right'), '已在右侧插入列')
          }
          disabled={disabled}
        >
          右列
        </Button>
      </Tooltip>
      <Tooltip title="删除当前行">
        <Button
          icon={<DeleteOutlined />}
          onClick={() => runOperation(spreadsheet => spreadsheet.deleteRow(), '已删除当前行')}
          disabled={disabled}
        >
          删行
        </Button>
      </Tooltip>
      <Tooltip title="删除当前列">
        <Button
          icon={<DeleteOutlined />}
          onClick={() => runOperation(spreadsheet => spreadsheet.deleteColumn(), '已删除当前列')}
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
