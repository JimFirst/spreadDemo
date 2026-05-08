import crypto from 'crypto'
import { prisma } from '../config/database'
import { logger } from '../logger/index'

export class DocumentService {
  async create(title: string, creatorId: string) {
    try {
      const document = await prisma.document.create({
        data: {
          title,
          creatorId,
          members: {
            create: {
              userId: creatorId,
              role: 'owner',
            },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })

      logger.info('文档创建成功', {
        documentId: document.id,
        title: document.title,
        creatorId,
      })

      return document
    } catch (error) {
      logger.error('文档创建失败', {
        error: error instanceof Error ? error.message : 'Unknown error',
        title,
        creatorId,
      })
      throw error
    }
  }

  async findAll(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.document.count({
        where: {
          members: {
            some: { userId },
          },
        },
      }),
    ])

    return {
      list: documents,
      pagination: {
        total,
        page,
        pageSize,
      },
    }
  }

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        snapshots: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })
  }

  async update(id: string, title: string) {
    const document = await prisma.document.update({
      where: { id },
      data: { title },
    })

    logger.info('文档更新成功', { documentId: id, title })

    return document
  }

  async delete(id: string) {
    await prisma.document.delete({
      where: { id },
    })

    logger.info('文档删除成功', { documentId: id })
  }

  async share(documentId: string, userId: string, role: string) {
    const member = await prisma.documentMember.create({
      data: {
        documentId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    logger.info('文档分享成功', { documentId, userId, role })

    return member
  }

  async removeMember(documentId: string, userId: string) {
    await prisma.documentMember.delete({
      where: {
        documentId_userId: { documentId, userId },
      },
    })

    logger.info('文档成员移除', { documentId, userId })
  }

  async getMembers(documentId: string) {
    return prisma.documentMember.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })
  }

  async createShareLink(
    documentId: string,
    createdBy: string,
    permission: 'read' | 'edit',
    expiresAt?: Date
  ) {
    const token = crypto.randomUUID()
    const shareLink = await prisma.documentShareLink.create({
      data: {
        documentId,
        token,
        permission,
        createdBy,
        expiresAt,
      },
    })
    logger.info('分享链接创建成功', { documentId, token, permission })
    return shareLink
  }

  async getShareLink(token: string) {
    return prisma.documentShareLink.findUnique({
      where: { token },
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  }

  async validateShareLink(token: string) {
    const link = await prisma.documentShareLink.findUnique({
      where: { token },
    })

    if (!link) {
      return { valid: false, reason: '链接不存在' }
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { valid: false, reason: '链接已过期' }
    }

    return {
      valid: true,
      documentId: link.documentId,
      permission: link.permission,
    }
  }

  async deleteShareLink(id: string) {
    await prisma.documentShareLink.delete({
      where: { id },
    })
    logger.info('分享链接删除成功', { id })
  }

  async getShareLinks(documentId: string) {
    return prisma.documentShareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const documentService = new DocumentService()
