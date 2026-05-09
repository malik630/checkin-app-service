import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import router from './router.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'

const app = express()

// Security & parsing
app.use(helmet())
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan('dev'))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', router)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app