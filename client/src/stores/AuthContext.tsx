import React, { createContext, useContext, useState, useEffect } from 'react'
import { userService } from '../services/api/user.service'

interface User {
  id: string
  username: string
  email?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      try {
        const response = await userService.getCurrentUser()
        const userData = response.data.data || response.data
        localStorage.setItem('token', userData.id)
        setUser(userData)
        setToken(savedToken)
      } catch (error) {
        localStorage.removeItem('token')
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
