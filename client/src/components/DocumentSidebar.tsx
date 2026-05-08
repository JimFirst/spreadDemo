import React, { useState, useEffect } from 'react'
import { Button, Select, message, Modal, Input, Tabs, Tag, Space, AutoComplete } from 'antd'
import { UserAddOutlined, LinkOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons'
import { documentService, DocumentMember, ShareLink } from '../services/api/document.service'
import { userService } from '../services/api/user.service'

interface Props {
  documentId: string
  currentUserId: string
}

export const DocumentSidebar: React.FC<Props> = ({ documentId, currentUserId }) => {
  const [members, setMembers] = useState<DocumentMember[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'links'>('users')

  useEffect(() => {
    loadData()
  }, [documentId])

  const loadData = async () => {
    try {
      const [membersRes, linksRes] = await Promise.all([
        documentService.getDocumentMembers(documentId),
        documentService.getShareLinks(documentId),
      ])
      setMembers(membersRes.data.data || membersRes.data)
      setShareLinks(linksRes.data.data || linksRes.data)
    } catch {
      message.error('加载数据失败')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await documentService.removeMember(documentId, userId)
      message.success('成员已移除')
      loadData()
    } catch {
      message.error('移除失败')
    }
  }

  const handleUpdateRole = async (userId: string, role: 'viewer' | 'editor') => {
    try {
      await documentService.updateMemberRole(documentId, userId, role)
      message.success('权限已更新')
      loadData()
    } catch {
      message.error('更新失败')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await documentService.deleteShareLink(documentId, linkId)
      message.success('链接已删除')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const isOwner = members.some(m => m.userId === currentUserId && m.role === 'owner')

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'owner':
        return <Tag color="gold">所有者</Tag>
      case 'editor':
        return <Tag color="blue">编辑</Tag>
      case 'viewer':
        return <Tag color="green">只读</Tag>
      default:
        return <Tag>{role}</Tag>
    }
  }

  return (
    <div
      style={{
        width: 320,
        backgroundColor: 'white',
        borderLeft: '1px solid #e5e7eb',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>文档设置</h2>

      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'users' | 'links')}
        items={[
          {
            key: 'users',
            label: `成员 (${members.length})`,
          },
          {
            key: 'links',
            label: `分享链接 (${shareLinks.length})`,
          },
        ]}
      />

      {activeTab === 'users' && (
        <div style={{ flex: 1 }}>
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {members.map(member => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {member.user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{member.user?.username || '未知用户'}</div>
                    <div>{getRoleTag(member.role)}</div>
                  </div>
                </div>
                {isOwner && member.role !== 'owner' && (
                  <Space size={4}>
                    <Select
                      value={member.role}
                      onChange={value => handleUpdateRole(member.userId, value)}
                      size="small"
                      style={{ width: 80 }}
                      options={[
                        { value: 'viewer', label: '只读' },
                        { value: 'editor', label: '编辑' },
                      ]}
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveMember(member.userId)}
                    />
                  </Space>
                )}
              </div>
            ))}
          </Space>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setShowShareModal(true)}
            style={{ marginTop: 16, width: '100%' }}
          >
            添加成员
          </Button>
        </div>
      )}

      {activeTab === 'links' && (
        <div style={{ flex: 1 }}>
          <Space direction="vertical" style={{ width: '100%', gap: 8 }}>
            {shareLinks.map(link => (
              <div
                key={link.id}
                style={{ padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {link.permission === 'edit' ? '编辑链接' : '只读链接'}
                  </span>
                  <Tag color={link.permission === 'edit' ? 'blue' : 'green'}>
                    {link.permission === 'edit' ? '可编辑' : '只读'}
                  </Tag>
                </div>
                {link.expiresAt && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    过期时间: {new Date(link.expiresAt).toLocaleDateString()}
                  </div>
                )}
                <Space size={4}>
                  <Input size="small" readOnly value={link.link} style={{ flex: 1 }} />
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(link.link)}
                  />
                  {isOwner && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteLink(link.id)}
                    />
                  )}
                </Space>
              </div>
            ))}
          </Space>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={() => setShowShareModal(true)}
            style={{ marginTop: 16, width: '100%' }}
          >
            生成链接
          </Button>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          documentId={documentId}
          initialTab={activeTab}
          members={members}
          onClose={() => {
            setShowShareModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

interface ShareModalProps {
  documentId: string
  initialTab: 'users' | 'links'
  members: DocumentMember[]
  onClose: () => void
}

const ShareModal: React.FC<ShareModalProps> = ({ documentId, initialTab, members, onClose }) => {
  const [tab, setTab] = useState<'users' | 'links'>(initialTab)
  const [permission, setPermission] = useState<'read' | 'edit'>('read')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (tab === 'users') {
      loadAllUsers()
    }
  }, [tab])

  const loadAllUsers = async () => {
    try {
      setUsersLoading(true)
      const res = await userService.getAllUsers()
      const users = res.data.data || res.data
      setAllUsers(Array.isArray(users) ? users : [])
    } catch {
      message.error('加载用户列表失败')
    } finally {
      setUsersLoading(false)
    }
  }

  const isAlreadyMember = (userId: string) => {
    return members.some(m => m.userId === userId)
  }

  const handleAddMember = async () => {
    if (!selectedUserId) {
      message.warning('请选择要添加的用户')
      return
    }

    try {
      setLoading(true)
      await documentService.shareDocument(documentId, selectedUserId, permission)
      message.success('成员已添加')
      setSelectedUserId(null)
      setSearchValue('')
      loadAllUsers()
    } catch {
      message.error('添加成员失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleGenerateLink = async () => {
    try {
      setLoading(true)
      const res = await documentService.createShareLink(documentId, permission)
      const link = res.data.data?.link || res.data.link
      setGeneratedLink(link)
      message.success('链接已生成')
    } catch {
      message.error('生成链接失败')
    } finally {
      setLoading(false)
    }
  }

  const autoCompleteOptions = filteredUsers.map(user => ({
    value: user.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{user.username}</span>
        {isAlreadyMember(user.id) && (
          <Tag color="default" style={{ marginLeft: 8 }}>
            已添加
          </Tag>
        )}
      </div>
    ),
    disabled: isAlreadyMember(user.id),
  }))

  return (
    <Modal title="分享文档" open onCancel={onClose} footer={null} width={480} destroyOnClose>
      <Tabs
        activeKey={tab}
        onChange={key => setTab(key as 'users' | 'links')}
        items={[
          { key: 'users', label: '分享给用户' },
          { key: 'links', label: '生成分享链接' },
        ]}
      />

      <div style={{ padding: '16px 0' }}>
        {tab === 'users' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 4, display: 'block' }}>
                选择用户
              </label>
              <AutoComplete
                style={{ width: '100%' }}
                options={autoCompleteOptions}
                onSearch={setSearchValue}
                onSelect={setSelectedUserId}
                placeholder="输入用户名搜索..."
                value={searchValue}
                onChange={setSearchValue}
                disabled={usersLoading}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, color: '#4b5563', marginBottom: 4, display: 'block' }}>
                权限
              </label>
              <Select
                value={permission}
                onChange={setPermission}
                style={{ width: '100%' }}
                options={[
                  { value: 'read', label: '只读' },
                  { value: 'edit', label: '可编辑' },
                ]}
              />
            </div>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              loading={loading}
              onClick={handleAddMember}
              disabled={!selectedUserId || isAlreadyMember(selectedUserId)}
              style={{ width: '100%' }}
            >
              添加成员
            </Button>
          </div>
        )}

        {tab === 'links' && (
          <div>
            {!generatedLink ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{ fontSize: 14, color: '#4b5563', marginBottom: 4, display: 'block' }}
                  >
                    链接权限
                  </label>
                  <Select
                    value={permission}
                    onChange={setPermission}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'read', label: '只读' },
                      { value: 'edit', label: '可编辑' },
                    ]}
                  />
                </div>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={handleGenerateLink}
                  style={{ width: '100%' }}
                >
                  生成链接
                </Button>
              </>
            ) : (
              <div>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>分享链接已生成：</p>
                <Input readOnly value={generatedLink} style={{ marginBottom: 12 }} />
                <Space size={4}>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink)
                      message.success('已复制到剪贴板')
                    }}
                  >
                    复制链接
                  </Button>
                  <Button onClick={() => setGeneratedLink(null)}>重新生成</Button>
                </Space>
              </div>
            )}
          </div>
        )}
        <Button onClick={onClose} style={{ marginTop: 16, width: '100%' }}>
          关闭
        </Button>
      </div>
    </Modal>
  )
}
