import { RequestHandler, Router } from 'express'
import * as CheckInController from './checkin.controller.js'

const router = Router()

router.post('/session', CheckInController.createOrResumeSession as RequestHandler)
router.patch('/session/step', CheckInController.advanceSessionStep as RequestHandler)
router.get('/verify-passport', CheckInController.verifyPassport as RequestHandler)
router.post('/baggage', CheckInController.saveBaggageDeclaration as RequestHandler)
router.get('/baggage/:passengerId', CheckInController.getBaggageDeclaration as RequestHandler)

export default router