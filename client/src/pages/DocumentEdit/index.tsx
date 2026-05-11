import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Card, Input, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { SpreadsheetEditor } from '../../components/spreadsheet/SpreadsheetEditor'
import { DocumentSidebar } from '../../components/DocumentSidebar'
import { useDocument, DocumentProvider } from '../../stores/DocumentContext'
import { useAuth } from '../../stores/AuthContext'

const DocumentEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { document, loadDocument, updateDocument } = useDocument()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')

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
    } catch {
      message.error('保存失败')
    }
  }

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
            </Space>
          }
          style={{ flex: 1 }}
        >
          <SpreadsheetEditor
            documentId={id!}
            userId={currentUserId}
            username={user?.username || ''}
          />
        </Card>
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
