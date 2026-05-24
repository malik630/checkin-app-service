import type { Response } from 'express'
import * as boardingService from './boarding.service.js'
import * as R from '../../utils/response.js'
import type { AuthenticatedRequest } from '../../types/index.js'

// POST /api/boarding/generate
export const generate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

// GET /api/boarding/my/all
export const getMyBoardingPasses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await boardingService.getAllBoardingPassesByUid(req.user.uid)
    R.ok(res, result.data, result.message)
  } catch (error: any) {
    R.serverError(res, error.message)
  }
}

// GET /api/boarding/my
export const getMyBoardingPass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await boardingService.getBoardingPassByUid(req.user.uid)
    R.ok(res, result.data, result.message)
  } catch (error: any) {
    if (error.message.includes('not found')) R.notFound(res, error.message)
    else R.serverError(res, error.message)
  }
}

// POST /api/boarding/verify
export const verify = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

// GET /api/boarding/verify/:passId
export const verifyByPassId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { passId } = req.params
    if (!passId || Array.isArray(passId)) {
      R.badRequest(res, 'passId is required')
      return
    }
    const result = await boardingService.verifyBoardingPass(passId)
    if (result.valid && result.data) {
      res.send(`
        <html><body style="font-family:sans-serif;padding:24px;text-align:center">
          <h1 style="color:green">✅ Boarding Pass Valide</h1>
          <p><b>${result.data.passengerName}</b></p>
          <p>Vol : ${result.data.flightNumber}</p>
          <p>Siège : ${result.data.seatNumber} - Porte : ${result.data.gate}</p>
          <p>Embarquement : ${result.data.boardingTime}</p>
          <p style="color:gray">Réf : ${result.data.bookingReference}</p>
        </body></html>
      `)
    } else {
      res.send(`
        <html><body style="font-family:sans-serif;padding:24px;text-align:center">
          <h1 style="color:red">❌ Boarding Pass Invalide</h1>
          <p>${result.message}</p>
        </body></html>
      `)
    }
  } catch (error: any) {
    R.serverError(res, error.message)
  }
}