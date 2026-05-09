import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/index'
import { extractUserFromToken } from '../config/jwt'
import { logger } from '../logger/index'
import { userService } from '../services/user.service'

const MOCK_USERS = [
  {
    id: 'user-001',
    username: 'Alice',
    email: 'alice@example.com',
  },
  {
    id: 'user-002',
    username: 'Bob',
    email: 'bob@example.com',
  },
  {
    id: 'user-003',
    username: 'Charlie',
    email: 'charlie@example.com',
  },
  {
    id: 'user-004',
    username: 'Diana',
    email: 'diana@example.com',
  },
  {
    id: 'user-005',
    username: 'Eve',
    email: 'eve@example.com',
  },
]

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({
        code: 1002,
        data: null,
        message: '未提供认证 Token',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = extractUserFromToken(token)
    const user = await userService.findOrCreate(decoded.id, decoded.username, decoded.email)

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
    }

    logger.debug('用户认证成功', {
      userId: req.user.id,
      path: req.path,
      method: req.method,
    })

    next()
  } catch (error) {
    logger.error('Token 验证失败', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    })

    return res.status(401).json({
      code: 1002,
      data: null,
      message: 'Token 无效或已过期',
    })
  }
}

export const mockAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization || ''
    const userId = authHeader.replace('Bearer ', '')
    const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
    let user
    if (userId) {
      try {
        user = await userService.findById(userId)
      } catch (error) {
        user = await userService.findOrCreate(mockUser.id, mockUser.username, mockUser.email)
      }
    } else {
      user = await userService.findOrCreate(mockUser.id, mockUser.username, mockUser.email)
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
    }

    logger.debug('用户认证成功（Mock模式）', {
      userId: req.user.id,
      username: req.user.username,
      path: req.path,
      method: req.method,
    })

    next()
  } catch (error) {
    logger.error('Mock 用户认证失败', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    })

    return res.status(401).json({
      code: 1002,
      data: null,
      message: '认证失败',
    })
  }
}

export const mockCollaborationAuth = async (
  context: { connection: { tags: Map<string, unknown>; query?: Record<string, string> } },
  next: () => void
): Promise<void> => {
  const userId = context.connection.auth?.token

  const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
  let user
  if (userId) {
    try {
      user = await userService.findById(userId)
    } catch (error) {
      user = await userService.findOrCreate(mockUser.id, mockUser.username, mockUser.email)
    }
  } else {
    user = await userService.findOrCreate(mockUser.id, mockUser.username, mockUser.email)
  }
  context.connection.tags.set('user', {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
  })
  next()
}
