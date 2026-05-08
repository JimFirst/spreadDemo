import { prisma } from '../config/database'
import { logger } from '../logger/index'

export class UserService {
  async findOrCreate(externalId: string, username: string, email?: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { externalId },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            externalId,
            username,
            email,
          },
        })
        logger.info('新用户创建', { userId: user.id, username })
      }

      return user
    } catch (error) {
      logger.error('用户查找/创建失败', {
        error: error instanceof Error ? error.message : 'Unknown error',
        externalId,
      })
      throw error
    }
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    })
  }

  async findByExternalId(externalId: string) {
    return prisma.user.findUnique({
      where: { externalId },
    })
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}

export const userService = new UserService()
