import { Request, Response, NextFunction } from 'express'

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[ErrorHandler]', err)
  res.status(500).json({
    success: false,
    message: err.message ?? 'Internal server error',
  })
}