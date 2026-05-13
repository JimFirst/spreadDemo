import React from 'react'
import { Button, Space, Tooltip, Dropdown, message } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { SpreadsheetEditorRef } from './SpreadsheetEditor'

interface SpreadsheetToolbarProps {
  spreadsheetRef: React.RefObject<SpreadsheetEditorRef | null>
  disabled?: boolean
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  spreadsheetRef,
  disabled = false,
}) => {
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
