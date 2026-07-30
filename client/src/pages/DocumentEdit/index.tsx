import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Card, Input, message, Spin } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { SpreadsheetEditor } from '@/components/spreadsheet/SpreadsheetEditor'
import { SpreadsheetToolbar } from '@/components/spreadsheet/SpreadsheetToolbar'
import { DocumentSidebar } from '@/components/DocumentSidebar'
import ChatPanel from '@/components/ChatPanel'
import { useDocument, DocumentProvider } from '@/stores/DocumentContext'
import { useAuth } from '@/stores/AuthContext'
import { useSpreadCollaboration } from '@/hooks/useSpreadCollaboration'
import { createSpreadOperations } from '@/hooks/useSpreadOperations'
import { documentService } from '@/services/api/document.service'

const DocumentEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { document, loadDocument, updateDocument, workbook } = useDocument()

  const currentUserId = user?.id || ''
  const { isConnected, isLoading, error, initCollaboration, initCollData } = useSpreadCollaboration(
    {
      userId: currentUserId,
      username: user?.username || '',
    }
  )
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [width, setWidth] = useState(450)

  const getWorkbook = useCallback(() => workbook, [workbook])

  const spreadsheet = useMemo(
    () => (workbook ? createSpreadOperations(getWorkbook) : null),
    [workbook, getWorkbook]
  )

  const handleInitCollaboration = useCallback(async () => {
    if (!id || !workbook || !spreadsheet) return

    try {
      // Check if workbook has content before joining collaboration
      let snapshot: unknown = undefined
      if (spreadsheet.hasContent()) {
        message.info('检测到表格有内容，正在创建快照...')
        snapshot = workbook.collaboration?.toSnapshot()
      }

      // Initialize collaboration
      await initCollaboration(id)
      // Bind workbook to collaboration document
      await initCollData(workbook, snapshot)
      // Update document collaboration status
      await documentService.updateCollaborationStatus(id, true)
      message.success('已开启协同编辑')
    } catch (err) {
      console.error('Failed to init collaboration:', err)
      message.error('开启协同编辑失败')
    }
  }, [id, workbook, spreadsheet, initCollaboration, initCollData])

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

  // Auto-initialize collaboration if document already has collaboration enabled
  useEffect(() => {
    if (document?.isCollaborating && workbook && id) {
      const autoInit = async () => {
        try {
          await initCollaboration(id)
          await initCollData(workbook)
        } catch (err) {
          console.error('Auto init collaboration failed:', err)
        }
      }
      autoInit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.isCollaborating, workbook, id])

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

  const exportFileName = `${title || document.title}.xlsx`

  if (error) {
    return <div className="spreadsheet-editor__error">连接失败: {error.message}</div>
  }
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Spin spinning={isLoading} fullscreen></Spin>
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
            getWorkbook={getWorkbook}
            disabled={!isEditor}
            fileName={exportFileName}
            initCollaboration={handleInitCollaboration}
            isCollaborating={isConnected}
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
          <SpreadsheetEditor />
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
