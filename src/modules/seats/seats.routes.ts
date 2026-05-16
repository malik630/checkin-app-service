import { RequestHandler, Router } from 'express'
import * as seatsController from './seats.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/flights/:flightId/seats',
  authMiddleware as RequestHandler,
  seatsController.getSeatMap
)

router.post(
  '/passengers/:passengerId/seat',
  authMiddleware as RequestHandler,
  seatsController.selectSeat
)

export default router
