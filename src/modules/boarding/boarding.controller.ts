import type { Response } from 'express'
import * as boardingService from './boarding.service.js'
import * as R from '../../utils/response.js'
import type { AuthenticatedRequest } from '../../types/index.js'

// Generate Boarding Pass
// POST /api/boarding/generate
// Body: { passengerId: string }
// Protected: the authenticated user must own the passenger record.
export const generate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { passengerId } = req.body as { passengerId?: string }

    if (!passengerId || typeof passengerId !== 'string') {
      R.badRequest(res, 'passengerId is required')
      return
    }

    const result = await boardingService.generateBoardingPass(passengerId)
    R.created(res, result.data, result.message)
  } catch (error: any) {
    R.badRequest(res, error.message)
  }
}

// Get Boarding Pass
// GET /api/boarding/my
// Protected: returns the boarding pass for the authenticated user.
export const getMyBoardingPass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await boardingService.getBoardingPassByUid(req.user.uid)
    R.ok(res, result.data, result.message)
  } catch (error: any) {
    if (error.message.includes('not found')) {
      R.notFound(res, error.message)
    } else {
      R.serverError(res, error.message)
    }
  }
}

// Verify Boarding Pass (QR scan)
// POST /api/boarding/verify
// Body: { passId: string }
// Public: called by gate/security scanners, no auth required.
export const verify = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { passId } = req.body as { passId?: string }

    if (!passId || typeof passId !== 'string') {
      R.badRequest(res, 'passId is required')
      return
    }

    const result = await boardingService.verifyBoardingPass(passId)
    R.ok(res, result)
  } catch (error: any) {
    R.serverError(res, error.message)
  }
}