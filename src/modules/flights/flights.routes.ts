import { Router } from 'express'
import * as flightsController from './flights.controller.js'

const router = Router()

router.get('/', flightsController.getAll)
router.get('/:id', flightsController.getById)

export default router
