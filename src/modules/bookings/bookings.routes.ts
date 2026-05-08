import { Router } from 'express'
import * as bookingsController from './bookings.controller.js'

const router = Router()

router.get('/', bookingsController.getMany)
router.get('/upcoming', bookingsController.getUpcoming)

export default router
