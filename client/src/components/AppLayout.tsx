import React from 'react'
import { Layout, Avatar, Dropdown, Menu } from 'antd'
import { UserOutlined, LogoutOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/AuthContext'

const { Header, Sider, Content } = Layout

interface Props {
  children: React.ReactNode
}

export const AppLayout: React.FC<Props> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ]

  const menuItems = [
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: '文档列表',
      onClick: () => navigate('/documents'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <style>{`
        .modern-sidebar {
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%) !important;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
        }

        .modern-sidebar .ant-menu {
          background: transparent !important;
          border-right: none !important;
        }

        .modern-sidebar .ant-menu-item {
          color: rgba(255, 255, 255, 0.7) !important;
          border-radius: 8px !important;
          margin: 4px 12px !important;
          height: 44px !important;
          line-height: 44px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .modern-sidebar .ant-menu-item:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          transform: translateX(4px);
        }

        .modern-sidebar .ant-menu-item-selected {
          color: #ffffff !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .modern-sidebar .ant-menu-item-selected:hover {
          transform: translateX(4px);
        }

        .modern-sidebar .ant-menu-item .anticon,
        .modern-sidebar .ant-menu-item .ant-menu-title-content {
          font-size: 15px !important;
        }

        .modern-header {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(20px);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modern-logo {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          position: relative;
        }

        .modern-logo::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 60%;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }

        .modern-user-trigger {
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
          background: rgba(102, 126, 234, 0.05);
          border: 1px solid transparent;
        }

        .modern-user-trigger:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .modern-user-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .modern-content {
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .modern-sidebar {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>

      <Sider
        width={240}
        className="modern-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>SpreadJS</div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: 240 }}>
        <Header
          className="modern-header"
          style={{ height: 64, position: 'fixed', top: 0, left: 240, right: 0, zIndex: 100 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
            }}
          >
            <div className="modern-logo">协作</div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar size="default" icon={<UserOutlined />} className="modern-user-avatar" />
                <span style={{ color: '#374151', fontWeight: 500 }}>
                  {user?.username || '用户'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          className="modern-content"
          style={{
            marginTop: 64,
            padding: 32,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
