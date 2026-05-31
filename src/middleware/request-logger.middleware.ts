import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'

const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
])

const redactSensitiveData = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map(item => redactSensitiveData(item))
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : redactSensitiveData(entry),
    ])
  )
}

const hasLoggedData = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0)
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID().slice(0, 8)
  const startedAt = Date.now()

  console.log(`[HTTP ${requestId}] RECEIVED ${req.method} ${req.originalUrl}`)

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt
    const body = redactSensitiveData(req.body)
    const query = redactSensitiveData(req.query)
    const statusLabel = res.statusCode >= 400 ? 'ERROR' : 'OK'

    if (hasLoggedData(query)) {
      console.log(`[HTTP ${requestId}] QUERY`, query)
    }

    if (hasLoggedData(body)) {
      console.log(`[HTTP ${requestId}] BODY`, body)
    }

    console.log(
      `[HTTP ${requestId}] STATUS ${res.statusCode} ${statusLabel} ${req.method} ${req.originalUrl} (${durationMs}ms)`
    )
  })

  next()
}
