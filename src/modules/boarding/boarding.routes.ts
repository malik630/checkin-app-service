import { RequestHandler, Router } from 'express'
import * as boardingController from './boarding.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

// Protected: generate a boarding pass after completing check-in step 5
router.post(
  '/generate',
  authMiddleware as RequestHandler,
  boardingController.generate as unknown as RequestHandler
)

// Protected: fetch the boarding pass of the authenticated user
router.get(
  '/my',
  authMiddleware as RequestHandler,
  boardingController.getMyBoardingPass as unknown as RequestHandler
)

// Public: verify a boarding pass from its QR code content (passId)
router.post('/verify', boardingController.verify as unknown as RequestHandler)

export default router