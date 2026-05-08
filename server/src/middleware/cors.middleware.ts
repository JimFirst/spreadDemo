import { Request, Response, NextFunction } from 'express'

export interface CorsOptions {
  origin: string
  credentials?: boolean
  methods?: string
  headers?: string
}

export const createCorsMiddleware = (options: CorsOptions) => {
  const {
    origin,
    credentials = true,
    methods = 'GET, POST, PUT, DELETE, OPTIONS',
    headers = 'Content-Type, Authorization',
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', methods)
    res.header('Access-Control-Allow-Headers', headers)
    res.header('Access-Control-Allow-Credentials', credentials.toString())

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200)
    }

    next()
  }
}
