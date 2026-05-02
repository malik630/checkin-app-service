import type { Response } from 'express'
import type { ApiResponse } from '../types/index.js'

export const ok = <T>(res: Response, data: T, message?: string): Response =>
  res.status(200).json({ success: true, data, message } satisfies ApiResponse<T>)

export const created = <T>(res: Response, data: T, message?: string): Response =>
  res.status(201).json({ success: true, data, message } satisfies ApiResponse<T>)

export const noContent = (res: Response): Response =>
  res.status(204).send()

export const badRequest = (res: Response, message: string): Response =>
  res.status(400).json({ success: false, message } satisfies ApiResponse)

export const unauthorized = (res: Response, message = 'Unauthorized'): Response =>
  res.status(401).json({ success: false, message } satisfies ApiResponse)

export const forbidden = (res: Response, message = 'Forbidden'): Response =>
  res.status(403).json({ success: false, message } satisfies ApiResponse)

export const notFound = (res: Response, message = 'Not found'): Response =>
  res.status(404).json({ success: false, message } satisfies ApiResponse)

export const conflict = (res: Response, message: string): Response =>
  res.status(409).json({ success: false, message } satisfies ApiResponse)

export const serverError = (res: Response, message = 'Internal server error'): Response =>
  res.status(500).json({ success: false, message } satisfies ApiResponse)
