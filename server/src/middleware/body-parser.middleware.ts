import express, { Express, Request, Response, NextFunction } from 'express'

export interface JsonOptions {
  limit?: string
}

export const createJsonMiddleware = (options: JsonOptions = {}) => {
  const limit = options.limit || '10mb'
  return express.json({ limit })
}

export interface UrlencodedOptions {
  extended?: boolean
}

export const createUrlencodedMiddleware = (options: UrlencodedOptions = {}) => {
  const extended = options.extended ?? true
  return express.urlencoded({ extended })
}

export const jsonMiddleware = express.json({ limit: '10mb' })
export const urlencodedMiddleware = express.urlencoded({ extended: true })
