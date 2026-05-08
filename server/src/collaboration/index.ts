import express, { Express, Request, Response } from 'express'
import { Server } from 'http'
import { Server as CollaborationServer } from '@grapecity-software/js-collaboration'
import * as OT from '@grapecity-software/js-collaboration-ot'
import { type } from '@grapecity-software/spread-sheets-collaboration'
import { MySQLAdapter } from './mysql-adapter'
import { PrismaClient } from '@prisma/client'
import { extractUserFromToken } from '../config/jwt'
import { logger } from '../logger/index'
import { createCorsMiddleware, jsonMiddleware, mockCollaborationAuth } from '../middleware'

OT.TypesManager.register(type)

export class CollaborationManager {
  private server!: CollaborationServer
  private app: Express
  private httpServer: Server
  private prisma: PrismaClient
  private dbAdapter: MySQLAdapter
  private documentServices!: OT.DocumentServices

  constructor(httpServer: Server) {
    this.app = express()
    this.httpServer = httpServer
    this.prisma = new PrismaClient()
    this.dbAdapter = new MySQLAdapter(this.prisma)
    this.documentServices = new OT.DocumentServices(this.dbAdapter)
  }

  async initialize(corsOrigin: string): Promise<void> {
    this.app.use(createCorsMiddleware({ origin: corsOrigin }))
    this.app.use(jsonMiddleware)

    this.server = new CollaborationServer({
      httpServer: this.httpServer,
    })

    this.server.use('connect', async (context: any, next: any) => {
      // const token = context.connection.auth?.token
      // if (!token) {
      //   return await next('未提供令牌')
      // }
      // try {
      //   const user = extractUserFromToken(token)
      //   context.connection.tags.set('user', user)
      //   await next()
      // } catch {
      //   await next('令牌无效')
      // }

      mockCollaborationAuth(context, next)
    })

    this.server.useFeature(OT.documentFeature(this.documentServices))

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() })
    })

    this.setupErrorHandlers()
  }

  private setupErrorHandlers(): void {
    this.httpServer.on('error', (error: Error) => {
      logger.error('协作管理器错误:', error)
    })

    process.on('uncaughtException', (error) => {
      logger.error('未捕获异常:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝:', { reason, promise })
    })
  }

  async shutdown(): Promise<void> {
    await this.prisma.$disconnect()
    this.httpServer.close()
  }
}

export const createCollaborationManager = async (
  httpServer: Server
): Promise<CollaborationManager> => {
  const manager = new CollaborationManager(httpServer)
  await manager.initialize(process.env.CORS_ORIGIN || 'http://localhost:5173')
  return manager
}
