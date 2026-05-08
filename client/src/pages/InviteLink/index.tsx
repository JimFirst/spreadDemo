import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Result, Button, Space } from 'antd'
import { documentService } from '../../services/api/document.service'

export const InviteLinkPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string | null>(null)

  useEffect(() => {
    const handleInvite = async () => {
      if (!token) {
        setError('链接无效')
        setLoading(false)
        return
      }

      try {
        const res = await documentService.validateShareLink(token)

        if (!res.data.data?.valid && !res.data.valid) {
          setError(res.data.data?.reason || res.data.reason || '链接已失效')
          setLoading(false)
          return
        }

        const documentId = res.data.data?.documentId || res.data.documentId
        const permission = res.data.data?.permission || res.data.permission

        setDocumentTitle(`文档权限: ${permission === 'edit' ? '可编辑' : '只读'}`)

        setTimeout(() => {
          navigate(`/documents/${documentId}`)
        }, 2000)
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || '链接验证失败'
        setError(errorMsg)
        setLoading(false)
      }
    }

    handleInvite()
  }, [token, navigate])

  if (loading) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#9ca3af' }}>正在验证邀请链接...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
      >
        <Result
          status="error"
          title="链接无效"
          subTitle={error}
          extra={
            <Button type="primary" onClick={() => navigate('/documents')}>
              返回文档列表
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <Space direction="vertical" style={{ marginTop: 16 }}>
          <span style={{ color: '#9ca3af' }}>验证成功，正在跳转...</span>
          {documentTitle && <span style={{ fontSize: 12, color: '#d1d5db' }}>{documentTitle}</span>}
        </Space>
      </div>
    </div>
  )
}
