import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Card, Input, Modal, message } from 'antd'
import { PlusOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons'
import { documentService, Document } from '../../services/api/document.service'

const { Search } = Input

export default function DocumentListPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const loadDocuments = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const response = await documentService.getDocuments(page, pageSize)
      setDocuments(response.data.list)
      setPagination({
        ...pagination,
        current: page,
        pageSize,
        total: response.data.pagination.total,
      })
    } catch (error) {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      message.warning('请输入文档标题')
      return
    }

    try {
      const response = await documentService.createDocument(newTitle)
      message.success('文档创建成功')
      setCreateModalVisible(false)
      setNewTitle('')
      navigate(`/documents/${response.data.id}`)
    } catch (error) {
      message.error('创建文档失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await documentService.deleteDocument(id)
          message.success('文档已删除')
          loadDocuments(pagination.current, pagination.pageSize)
        } catch (error) {
          message.error('删除文档失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Document) => (
        <a onClick={() => navigate(`/documents/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Document) => (
        <Space>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            danger
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>我的文档</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建文档
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadDocuments(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="新建文档"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false)
          setNewTitle('')
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文档标题"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </div>
  )
}
