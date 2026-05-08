import 'dotenv/config'
import app from './app'
import { createServer } from 'http'
import { createCollaborationManager } from './collaboration/index'
import { logger } from './logger/index'
import { prisma } from './config/database'

const PORT = process.env.PORT || 3000

const httpServer = createServer(app)

createCollaborationManager(httpServer)
  .then(() => {
    logger.info('协作管理器初始化完成', { port: PORT })
  })
  .catch((error) => {
    logger.error('协作管理器初始化失败:', error)
  })

httpServer.listen(PORT, () => {
  logger.info(`服务器运行在端口 ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
  })
})

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  await prisma.$disconnect()
  process.exit(0)
})
