import { RequestHandler, Router } from 'express'
import * as boardingController from './boarding.controller.js'
import * as boardingService from './boarding.service.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import prisma from '../../prisma/client.js';

const router = Router()

// Protected: generate a boarding pass after completing check-in step 5
router.post(
  '/generate',
  authMiddleware as RequestHandler,
  boardingController.generate as unknown as RequestHandler
)

// Prot}ected: fetch the boarding pass of the authenticated user
router.get(
  '/my',
  authMiddleware as RequestHandler,
  boardingController.getMyBoardingPass as unknown as RequestHandler
)

// Public: verify a boarding pass from its QR code content (passId)
router.post('/verify', boardingController.verify as unknown as RequestHandler)
// GET /api/boarding/verify/:passId
router.get(
  '/verify/:passId',
  boardingController.verifyByPassId as unknown as RequestHandler
)

export default router