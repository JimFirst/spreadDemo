import { Response } from 'express'
import { snapshotService } from '../services/snapshot.service'
import { AppError } from '../middleware/error.middleware'
import { logger } from '../logger/index'
import { AuthenticatedRequest } from '../types/index'

export class SnapshotController {
  async create(req: AuthenticatedRequest, res: Response) {
    const { documentId } = req.params
    const { data } = req.body

    if (!data) {
      throw new AppError(400, 1001, '快照数据不能为空')
    }

    const snapshot = await snapshotService.create(documentId, data)

    res.status(201).json({
      code: 0,
      data: snapshot,
      message: '快照创建成功',
    })
  }

  async findAll(req: AuthenticatedRequest, res: Response) {
    const { documentId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 50

    const result = await snapshotService.findAll(documentId, page, pageSize)

    res.json({
      code: 0,
      data: result,
      message: '获取快照列表成功',
    })
  }

  async findById(req: AuthenticatedRequest, res: Response) {
    const { documentId, snapshotId } = req.params
    const snapshot = await snapshotService.findById(snapshotId)

    if (!snapshot || snapshot.documentId !== documentId) {
      throw new AppError(404, 1004, '快照不存在')
    }

    res.json({
      code: 0,
      data: snapshot,
      message: '获取快照详情成功',
    })
  }

  async addChangeSet(req: AuthenticatedRequest, res: Response) {
    const { documentId } = req.params
    const { ops } = req.body
    const userId = req.user?.id

    if (!ops) {
      throw new AppError(400, 1001, '变更集数据不能为空')
    }

    if (!userId) {
      throw new AppError(401, 1002, '用户未认证')
    }

    const changeSet = await snapshotService.addChangeSet(documentId, userId, ops)

    logger.info('变更集添加', {
      documentId,
      changeSetId: changeSet.id,
      userId,
    })

    res.status(201).json({
      code: 0,
      data: changeSet,
      message: '变更集添加成功',
    })
  }

  async getChangeSets(req: AuthenticatedRequest, res: Response) {
    const { documentId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 100

    const result = await snapshotService.getChangeSets(documentId, page, pageSize)

    res.json({
      code: 0,
      data: result,
      message: '获取变更集列表成功',
    })
  }

  async getChangeSetById(req: AuthenticatedRequest, res: Response) {
    const { documentId, changesetId } = req.params
    const changeSet = await snapshotService.getChangeSetById(changesetId)

    if (!changeSet || changeSet.documentId !== documentId) {
      throw new AppError(404, 1004, '变更集不存在')
    }

    res.json({
      code: 0,
      data: changeSet,
      message: '获取变更集详情成功',
    })
  }
}

export const snapshotController = new SnapshotController()
