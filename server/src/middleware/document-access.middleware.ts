import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/index'
import { prisma } from '../config/database'

export const documentAccessMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const documentId = req.params.id || req.params.documentId
    const userId = req.user!.id

    const membership = await prisma.documentMember.findUnique({
      where: {
        documentId_userId: { documentId, userId },
      },
    })

    if (!membership) {
      return res.status(403).json({
        code: 1003,
        data: null,
        message: '无权访问此文档',
      })
    }

    req.documentRole = membership.role as 'viewer' | 'editor' | 'owner'
    next()
  } catch (error) {
    next(error)
  }
}

export const documentOwnerMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.documentRole !== 'owner') {
    return res.status(403).json({
      code: 1003,
      data: null,
      message: '需要文档所有者权限',
    })
  }
  next()
}
