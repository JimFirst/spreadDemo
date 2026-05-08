import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Card, Input, message, Modal, Table } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons'
import { SpreadsheetEditor } from '../../components/spreadsheet/SpreadsheetEditor'
import { DocumentSidebar } from '../../components/DocumentSidebar'
import { useDocument, DocumentProvider } from '../../stores/DocumentContext'
import { useAuth } from '../../stores/AuthContext'

const DocumentEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { document, snapshots, loadDocument, updateDocument, createSnapshot } = useDocument()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [historyVisible, setHistoryVisible] = useState(false)

  useEffect(() => {
    if (id) {
      loadDocument(id)
    }
  }, [id, loadDocument])

  useEffect(() => {
    if (document) {
      setTitle(document.title)
    }
  }, [document])

  const handleSave = async () => {
    if (!id || !title.trim()) return

    try {
      await updateDocument(title)
      message.success('文档保存成功')
      setEditing(false)
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCreateSnapshot = async () => {
    if (!id) return

    Modal.confirm({
      title: '创建快照',
      content: '确定要创建当前文档的快照吗？',
      onOk: async () => {
        try {
          const data = captureCurrentData()
          await createSnapshot(data)
          message.success('快照创建成功')
          if (id) loadDocument(id)
        } catch (error) {
          message.error('快照创建失败')
        }
      },
    })
  }

  const captureCurrentData = () => {
    return {
      data: [],
      formulas: {},
      rowCount: 100,
      columnCount: 26,
    }
  }

  const historyColumns = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ]

  if (!document) {
    return <div style={{ padding: 24 }}>加载中...</div>
  }

  const currentUserId = user?.id || ''

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, height: '100vh' }}
      >
        <Card
          title={
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')} />
              {editing ? (
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: 300 }}
                  autoFocus
                  onPressEnter={handleSave}
                />
              ) : (
                <span onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
                  {document.title}
                </span>
              )}
            </Space>
          }
          extra={
            <Space>
              {editing && (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                  保存
                </Button>
              )}
              <Button icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
                历史版本
              </Button>
              <Button icon={<SaveOutlined />} onClick={handleCreateSnapshot}>
                创建快照
              </Button>
            </Space>
          }
          style={{ flex: 1 }}
        >
          <SpreadsheetEditor documentId={id!} />
        </Card>

        <Modal
          title="历史版本"
          open={historyVisible}
          onCancel={() => setHistoryVisible(false)}
          footer={null}
          width={600}
        >
          <Table
            columns={historyColumns}
            dataSource={snapshots}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Modal>
      </div>
      <DocumentSidebar documentId={id!} currentUserId={currentUserId} />
    </div>
  )
}

export default function DocumentEditPage() {
  return (
    <DocumentProvider>
      <DocumentEditContent />
    </DocumentProvider>
  )
}
