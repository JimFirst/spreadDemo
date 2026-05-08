import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DocumentListPage from './pages/DocumentList'
import DocumentEditPage from './pages/DocumentEdit'
import { InviteLinkPage } from './pages/InviteLink'
import { SettingsPage } from './pages/Settings'
import { AuthProvider } from './stores/AuthContext'
import { AppLayout } from './components/AppLayout'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/documents" element={<DocumentListPage />} />
            <Route path="/documents/:id" element={<DocumentEditPage />} />
            <Route path="/invite/:token" element={<InviteLinkPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App