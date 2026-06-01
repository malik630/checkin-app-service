import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import router from './router.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { requestLogger } from './middleware/request-logger.middleware.js'

const app = express()

// Logging first so every request gets a start/end line, even auth failures.
app.use(requestLogger)

// Security & parsing
app.use(helmet())
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', router)

app.use('/uploads', express.static('uploads'))

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
