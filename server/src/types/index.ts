import { Request } from 'express'

export interface AuthenticatedUser {
  id: string
  username: string
  email?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser
  documentRole?: 'viewer' | 'editor' | 'owner'
}

export interface ApiResponse<T = any> {
  code: number
  data: T | null
  message: string
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    list: T[]
    pagination: {
      total: number
      page: number
      pageSize: number
    }
  }
}
