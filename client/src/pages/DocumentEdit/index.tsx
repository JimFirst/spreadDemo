import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Card, Input, message } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { SpreadsheetEditor, SpreadsheetEditorRef } from '@/components/spreadsheet/SpreadsheetEditor'
import { SpreadsheetToolbar } from '@/components/spreadsheet/SpreadsheetToolbar'
import { DocumentSidebar } from '@/components/DocumentSidebar'
import ChatPanel from '@/components/ChatPanel'
import { useDocument, DocumentProvider } from '@/stores/DocumentContext'
import { useAuth } from '@/stores/AuthContext'

const DocumentEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { document, loadDocument, updateDocument } = useDocument()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [width, setWidth] = useState(300)

  const spreadsheetRef = useRef<SpreadsheetEditorRef>(null)

  const isEditor = user?.role !== 'viewer'

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
  const exportFileName = `${title || document.title}.xlsx`

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <SpreadsheetToolbar
            spreadsheetRef={spreadsheetRef}
            disabled={!isEditor}
            fileName={exportFileName}
          />
        </div>
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
          style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}
          styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
        >
          <SpreadsheetEditor
            ref={spreadsheetRef}
            documentId={id!}
            userId={currentUserId}
            username={user?.username || ''}
          />
        </Card>
      </div>
      <ChatPanel chatPanelWidth={width} onChatPanelWidthChange={setWidth} />
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
