import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import type { AuthenticatedRequest } from '../types/index.js'

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  // Expect header: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AuthMiddleware] Missing bearer token for ${req.method} ${req.originalUrl} STATUS 401`)
    res.status(401).json({ success: false, message: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    console.log(`[AuthMiddleware] Authenticated uid=${decoded.uid} ${req.method} ${req.originalUrl}`)
    next()
  } catch {
    console.warn(`[AuthMiddleware] Invalid token for ${req.method} ${req.originalUrl} STATUS 401`)
    res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}
