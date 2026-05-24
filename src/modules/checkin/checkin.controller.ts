import { Request, Response } from 'express'
import * as CheckinService from './checkin.service.js'
import type {
  CreateSessionRequest,
  SaveBaggageRequest,
  UpdateStepRequest,
} from '../../types/checkin.types.js';
import type { AuthenticatedRequest } from "../../types/index.js";

// POST /api/checkin/session
export const createOrResumeSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { passengerId, bookingId } = req.body as CreateSessionRequest
    const uid = (req as AuthenticatedRequest).user.uid

    console.log("=== CREATE SESSION BODY ===")
    console.log(req.body)
    console.log("=== CREATE SESSION UID ===")
    console.log(uid)
    if (!passengerId || typeof passengerId !== 'string') {
      res.status(400).json({ success: false, message: 'passengerId is required' })
      return
    }

    if (!bookingId || typeof bookingId !== 'string') {
      res.status(400).json({ success: false, message: 'bookingId is required' })
      return
    }

    const result = await CheckinService.createOrResumeSession(passengerId, bookingId, uid)
    res.status(201).json(result)
  } catch (error: any) {
    const status = error.message.includes('not yet open') || error.message.includes('closed')
      ? 422
      : error.message.includes('not found')
      ? 404
      : 400
    res.status(status).json({ success: false, message: error.message })
  }
}

// PATCH /api/checkin/session/step
export const advanceSessionStep = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { passengerId, step } = req.body as UpdateStepRequest

    if (!passengerId || typeof passengerId !== 'string') {
      res.status(400).json({ success: false, message: 'passengerId is required' })
      return
    }
    if (!step || typeof step !== 'string') {
      res.status(400).json({ success: false, message: 'step is required' })
      return
    }

    const result = await CheckinService.advanceSessionStep(passengerId, step)
    res.status(200).json(result)
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 400
    res.status(status).json({ success: false, message: error.message })
  }
}

// GET /api/checkin/verify-passport
export const verifyPassport = async (req: Request, res: Response) => {
  try {
    const {
      passportNumber,
      lastName,
      firstName,
      nationality,
      dateOfBirth,
      expiryDate,
    } = req.query

    if (!passportNumber || typeof passportNumber !== 'string') {
      return res.status(400).json({ error: 'passportNumber query param is required' })
    }
    if (!lastName || typeof lastName !== 'string') {
      return res.status(400).json({ error: 'lastName query param is required' })
    }

    const passenger = await CheckinService.verifyPassport(
      passportNumber,
      lastName,
      firstName as string,
      nationality as string,
      dateOfBirth as string,
      expiryDate as string
    )

    if (!passenger) {
      return res.status(404).json({
        error: 'Passport does not match any booking. Please check your passport and try again.',
      })
    }
    console.log("=== VERIFY PASSPORT RESPONSE ===")
    console.log(JSON.stringify({ passenger }, null, 2))
    return res.status(200).json({ passenger })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}

// POST /api/checkin/baggage
export const saveBaggageDeclaration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const passengerId = req.body.passengerId
    const body: SaveBaggageRequest = req.body
    const result = await CheckinService.saveBaggageDeclaration(passengerId, body)
    res.status(200).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}

// GET /api/checkin/baggage/:passengerId
export const getBaggageDeclaration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const passengerIdParam = req.params.passengerId
    const passengerId = Array.isArray(passengerIdParam)
      ? passengerIdParam[0]
      : passengerIdParam
    const result = await CheckinService.getBaggageDeclaration(passengerId)
    res.status(200).json(result)
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message })
  }
}