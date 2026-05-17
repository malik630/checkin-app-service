import type { Response } from 'express'
import * as bookingsService from './bookings.service.js'
import type { AuthenticatedRequest } from '../../types/index.js'

export const getMany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await bookingsService.getAllBookings(req.user.uid)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getUpcoming = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await bookingsService.getUpcomingBookings(req.user.uid)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const search = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pnr, lastName } = req.query

    if (!pnr || typeof pnr !== 'string') {
      return res.status(400).json({ error: 'Booking reference is required' })
    }
    if (!lastName || typeof lastName !== 'string') {
      return res.status(400).json({ error: 'Last name is required' })
    }
    if (pnr.trim().length < 3) {
      return res.status(400).json({ error: 'Booking reference too short' })
    }
    if (lastName.trim().length < 2) {
      return res.status(400).json({ error: 'Last name too short' })
    }

    const booking = await bookingsService.searchByPnrAndLastName(pnr, lastName)

    if (!booking) {
      return res.status(404).json({
        error: 'No booking found for this reference and last name combination',
      })
    }

    res.json(booking)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}