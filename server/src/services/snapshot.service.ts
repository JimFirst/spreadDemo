import { prisma } from '../config/database'
import { logger } from '../logger/index'

export class SnapshotService {
  async create(documentId: string, data: any) {
    try {
      const lastSnapshot = await this.getLatest(documentId)
      const version = lastSnapshot ? lastSnapshot.version + 1 : 1

      const snapshot = await prisma.snapshot.create({
        data: {
          documentId,
          data,
          version,
        },
      })

      logger.info('快照创建成功', {
        documentId,
        snapshotId: snapshot.id,
        version,
      })

      return snapshot
    } catch (error) {
      logger.error('快照创建失败', {
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
      })
      throw error
    }
  }

  async findAll(documentId: string, page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize

    const [snapshots, total] = await Promise.all([
      prisma.snapshot.findMany({
        where: { documentId },
        orderBy: { version: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.snapshot.count({ where: { documentId } }),
    ])

    return {
      list: snapshots,
      pagination: { total, page, pageSize },
    }
  }

  async findById(id: string) {
    return prisma.snapshot.findUnique({
      where: { id },
      include: {
        changesets: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  async getLatest(documentId: string) {
    return prisma.snapshot.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    })
  }

  async addChangeSet(documentId: string, userId: string, ops: any) {
    const latestSnapshot = await this.getLatest(documentId)

    if (!latestSnapshot) {
      throw new Error('文档快照不存在')
    }

    const changeSet = await prisma.changeSet.create({
      data: {
        documentId,
        snapshotId: latestSnapshot.id,
        userId,
        ops,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    logger.debug('变更集创建', {
      documentId,
      changeSetId: changeSet.id,
      userId,
      opsCount: Array.isArray(ops) ? ops.length : 0,
    })

    return changeSet
  }

  async getChangeSets(documentId: string, page = 1, pageSize = 100) {
    const skip = (page - 1) * pageSize

    const [changeSets, total] = await Promise.all([
      prisma.changeSet.findMany({
        where: { documentId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.changeSet.count({ where: { documentId } }),
    ])

    return {
      list: changeSets,
      pagination: { total, page, pageSize },
    }
  }

  async getChangeSetById(id: string) {
    return prisma.changeSet.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })
  }
}

export const snapshotService = new SnapshotService()
