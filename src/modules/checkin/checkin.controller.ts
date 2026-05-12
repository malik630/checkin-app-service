import { Request, Response } from 'express'
import * as checkinService from './checkin.service.js'

/**
 * GET /api/checkin/verify-passport?passportNumber=AB123456&lastName=Djerfi
 *
 * Verifies that the scanned passport belongs to a passenger in the DB.
 * Returns the passenger record on match, 404 on mismatch.
 */
export const verifyPassport = async (req: Request, res: Response) => {
  try {
    const { 
      passportNumber, 
      lastName, 
      firstName, 
      nationality,
      dateOfBirth,
      expiryDate 
    } = req.query

    if (!passportNumber || typeof passportNumber !== 'string') {
      return res.status(400).json({ error: 'passportNumber query param is required' })
    }
    if (!lastName || typeof lastName !== 'string') {
      return res.status(400).json({ error: 'lastName query param is required' })
    }

    const passenger = await checkinService.verifyPassport(
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

    return res.status(200).json({ passenger })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
