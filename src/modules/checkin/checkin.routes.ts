import { RequestHandler, Router } from 'express'
import * as checkinController from './checkin.controller.js'

const router = Router()

// GET /api/checkin/verify-passport?passportNumber=AB123456&lastName=Djerfi
router.get('/verify-passport', checkinController.verifyPassport as RequestHandler)

export default router
