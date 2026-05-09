import 'dotenv/config'
import app from './app'
import { createServer } from 'http'
import { Server } from 'https'
import { createCollaborationManager } from './collaboration/index'
import { logger } from './logger/index'
import { prisma } from './config/database'

const PORT = process.env.PORT || 3000

let httpServer: ReturnType<typeof createServer>
let collaborationManager: any

const startServer = async () => {
  try {
    httpServer = createServer(app)

    collaborationManager = await createCollaborationManager(httpServer)
    await collaborationManager.initialize(process.env.CORS_ORIGIN || 'http://localhost:5173')
    logger.info('协作管理器初始化完成', { port: PORT })

    await new Promise<void>((resolve, reject) => {
      const server = httpServer.listen(PORT, () => {
        logger.info(`服务器运行在端口 ${PORT}`, {
          environment: process.env.NODE_ENV,
          port: PORT,
        })
        resolve()
      })

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`端口 ${PORT} 已被占用，尝试关闭旧进程...`)
          reject(error)
        } else {
          reject(error)
        }
      })
    })
  } catch (error) {
    logger.error('服务器启动失败:', error)
    process.exit(1)
  }
}

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received: starting graceful shutdown`)

  if (httpServer) {
    logger.info('Closing HTTP server...')
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        logger.info('HTTP server closed')
        resolve()
      })
    })
  }

  if (collaborationManager) {
    logger.info('Closing collaboration manager...')
    try {
      await collaborationManager.shutdown()
      logger.info('Collaboration manager closed')
    } catch (error) {
      logger.error('关闭协作管理器时出错:', error)
    }
  }

  logger.info('Disconnecting from database...')
  try {
    await prisma.$disconnect()
    logger.info('Database disconnected')
  } catch (error) {
    logger.error('断开数据库连接时出错:', error)
  }

  logger.info('Graceful shutdown completed')
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

startServer()
