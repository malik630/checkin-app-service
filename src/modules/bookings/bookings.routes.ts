import { RequestHandler, Router } from 'express'
import * as bookingsController from './bookings.controller.js'

const router = Router()

router.get('/', bookingsController.getMany as unknown as RequestHandler)
router.get('/upcoming', bookingsController.getUpcoming as unknown as RequestHandler)
router.get('/search', bookingsController.search as unknown as RequestHandler)

export default router
