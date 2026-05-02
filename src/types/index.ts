import type { Request } from 'express'

// Augment Express Request to carry the authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    uid: string
    email: string
  }
}

// Standard API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string>[]
}
