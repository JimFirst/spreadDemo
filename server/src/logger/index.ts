import winston from 'winston'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'
import DailyRotateFile from 'winston-daily-rotate-file'
import { logFormat, consoleFormat } from './format'

const logDir = process.env.LOG_DIR || './logs'
const maxFiles = process.env.LOG_MAX_FILES || '180d'

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles,
    level: 'error',
    format: logFormat,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'ws-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles,
    format: logFormat,
  }),
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles,
    maxSize: '20m',
    format: logFormat,
  }),
]

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: {
    service: 'spreadjs-api',
    environment: process.env.NODE_ENV,
  },
  transports,
})

export const morganMiddleware = morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { type: 'http_access' })
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
})
