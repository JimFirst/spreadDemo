import { Response } from 'express'
import { documentService } from '../services/document.service'
import { AuthenticatedRequest } from '../types/index'
import { AppError } from '../middleware/error.middleware'
import { prisma } from '../config/database'

export class DocumentController {
  async create(req: AuthenticatedRequest, res: Response) {
    const { title } = req.body
    const userId = req.user!.id

    if (!title) {
      throw new AppError(400, 1001, '文档标题不能为空')
    }

    const document = await documentService.create(title, userId)

    res.status(201).json({
      code: 0,
      data: document,
      message: '文档创建成功',
    })
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    const result = await documentService.findAll(userId, page, pageSize)

    res.json({
      code: 0,
      data: result,
      message: '获取文档列表成功',
    })
  }

  async findById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const document = await documentService.findById(id)

    if (!document) {
      throw new AppError(404, 1004, '文档不存在')
    }

    res.json({
      code: 0,
      data: document,
      message: '获取文档详情成功',
    })
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const { title } = req.body

    if (!title) {
      throw new AppError(400, 1001, '文档标题不能为空')
    }

    const document = await documentService.update(id, title)

    res.json({
      code: 0,
      data: document,
      message: '文档更新成功',
    })
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    await documentService.delete(id)

    res.json({
      code: 0,
      data: null,
      message: '文档删除成功',
    })
  }

  async share(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const { userId, role } = req.body

    if (!userId || !role) {
      throw new AppError(400, 1001, '用户 ID 和角色不能为空')
    }

    const member = await documentService.share(id, userId, role)

    res.status(201).json({
      code: 0,
      data: member,
      message: '文档分享成功',
    })
  }

  async removeMember(req: AuthenticatedRequest, res: Response) {
    const { id, userId } = req.params
    await documentService.removeMember(id, userId)

    res.json({
      code: 0,
      data: null,
      message: '成员移除成功',
    })
  }

  async getMembers(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const members = await documentService.getMembers(id)

    res.json({
      code: 0,
      data: members,
      message: '获取成员列表成功',
    })
  }

  async getMyRole(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const userId = req.user!.id

    const member = await prisma.documentMember.findUnique({
      where: {
        documentId_userId: {
          documentId: id,
          userId: userId,
        },
      },
    })

    res.json({
      code: 0,
      data: {
        role: member?.role || 'viewer',
      },
      message: '获取用户角色成功',
    })
  }

  async createShareLink(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const { permission = 'read', expiresAt } = req.body
    const userId = req.user!.id

    if (!['read', 'edit'].includes(permission)) {
      throw new AppError(400, 1001, '无效的权限类型')
    }

    const shareLink = await documentService.createShareLink(
      id,
      userId,
      permission,
      expiresAt ? new Date(expiresAt) : undefined
    )

    res.status(201).json({
      code: 0,
      data: {
        id: shareLink.id,
        token: shareLink.token,
        permission: shareLink.permission,
        expiresAt: shareLink.expiresAt,
        link: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${shareLink.token}`,
      },
      message: '分享链接创建成功',
    })
  }

  async getShareLinks(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const links = await documentService.getShareLinks(id)

    res.json({
      code: 0,
      data: links.map((link) => ({
        id: link.id,
        token: link.token,
        permission: link.permission,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        link: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${link.token}`,
      })),
      message: '获取分享链接列表成功',
    })
  }

  async deleteShareLink(req: AuthenticatedRequest, res: Response) {
    const { linkId } = req.params
    await documentService.deleteShareLink(linkId)

    res.json({
      code: 0,
      data: null,
      message: '分享链接删除成功',
    })
  }

  async validateShareLink(req: any, res: Response) {
    const { token } = req.params
    const result = await documentService.validateShareLink(token)

    if (!result.valid) {
      throw new AppError(403, 1003, result.reason || '链接无效')
    }

    res.json({
      code: 0,
      data: result,
      message: '链接验证成功',
    })
  }

  async updateMemberRole(req: AuthenticatedRequest, res: Response) {
    const { id, userId } = req.params
    const { role } = req.body

    if (!['viewer', 'editor'].includes(role)) {
      throw new AppError(400, 1001, '无效的角色')
    }

    const member = await prisma.documentMember.update({
      where: { documentId_userId: { documentId: id, userId } },
      data: { role },
      include: { user: { select: { id: true, username: true } } },
    })

    res.json({
      code: 0,
      data: member,
      message: '成员权限更新成功',
    })
  }

  async updateCollaborationStatus(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const { isCollaborating } = req.body

    if (typeof isCollaborating !== 'boolean') {
      throw new AppError(400, 1001, 'isCollaborating 必须是布尔值')
    }

    const document = await prisma.document.update({
      where: { id },
      data: { isCollaborating },
    })

    res.json({
      code: 0,
      data: document,
      message: '协同状态更新成功',
    })
  }

  async updateContent(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      throw new AppError(400, 1001, '内容不能为空')
    }

    const document = await documentService.saveContent(id, content)

    res.json({
      code: 0,
      data: document,
      message: '文档内容保存成功',
    })
  }

  async getContent(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params
    const content = await documentService.getContent(id)

    res.json({
      code: 0,
      data: content,
      message: '获取文档内容成功',
    })
  }
}

export const documentController = new DocumentController()
