import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  name: string
  email?: string
}

export interface UserInfo {
  id: string
  username: string
  email?: string
}

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'default-secret'
  return jwt.verify(token, secret) as JwtPayload
}

export const extractUserFromToken = (token: string): UserInfo => {
  const decoded = verifyToken(token)
  return {
    id: decoded.sub,
    username: decoded.name,
    email: decoded.email,
  }
}

export const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'default-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}
