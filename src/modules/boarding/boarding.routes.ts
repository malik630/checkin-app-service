import { RequestHandler, Router } from 'express'
import * as boardingController from './boarding.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

// POST /api/boarding/generate
router.post('/generate', authMiddleware as RequestHandler, boardingController.generate as unknown as RequestHandler)

// GET /api/boarding/my/all
router.get('/my/all', authMiddleware as RequestHandler, boardingController.getMyBoardingPasses as unknown as RequestHandler)

// GET /api/boarding/my
router.get('/my', authMiddleware as RequestHandler, boardingController.getMyBoardingPass as unknown as RequestHandler)

// POST /api/boarding/verify
router.post('/verify', boardingController.verify as unknown as RequestHandler)

// GET /api/boarding/verify/:passId
router.get('/verify/:passId', boardingController.verifyByPassId as unknown as RequestHandler)

export default router