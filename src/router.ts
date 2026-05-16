import { RequestHandler, Router } from 'express'

import bookingsRoutes from './modules/bookings/bookings.routes.js'
import flightsRoutes from './modules/flights/flights.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import checkinRoutes from './modules/checkin/checkin.routes.js'
import seatsRoutes from './modules/seats/seats.routes.js'
/*import boardingRoutes from './modules/boarding/boarding.routes.js'
import notificationsRoutes from './modules/notifications/notifications.routes.js'*/

import { authMiddleware } from './middleware/auth.middleware.js'

const router = Router()

router.use('/auth', authRoutes)

router.use('/bookings', authMiddleware as RequestHandler, bookingsRoutes)
router.use('/flights', authMiddleware as RequestHandler, flightsRoutes)
router.use('/checkin', checkinRoutes)
router.use('/selectseats', seatsRoutes)
/*
router.use('/boarding', boardingRoutes)
router.use('/notifications', notificationsRoutes)*/

export default router
