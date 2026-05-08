import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger/index'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: number,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('请求处理错误', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      data: null,
      message: err.message,
    })
  }

  return res.status(500).json({
    code: 5001,
    data: null,
    message: '服务器内部错误',
  })
}
