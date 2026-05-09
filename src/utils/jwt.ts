import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface JwtPayload {
  uid: string
  email: string
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions)

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwt.secret) as JwtPayload
