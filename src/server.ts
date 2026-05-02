import 'dotenv/config'
import app from './app.js'
import { env } from './config/env.js'
import prisma from './prisma/client.js'

const start = async () => {
  try {
    // Verify DB connection on startup
    await prisma.$connect()
    console.log('Database connected')

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`)
      console.log(`API docs: http://localhost:${env.port}/api`)
      console.log(`Environment: ${env.nodeEnv}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`)
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

start()
