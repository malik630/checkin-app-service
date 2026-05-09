import { Request, Response } from 'express'
import * as bookingsService from './bookings.service.js'


export const getMany = async (req: Request, res: Response) => {
  try {
    const uidRaw = req.query.uid
    const uid = Array.isArray(uidRaw) ? uidRaw[0] : uidRaw

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'uid query parameter is required and must be a string' })
    }

    const bookings = await bookingsService.getAllBookings(uid)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getUpcoming = async (req: Request, res: Response) => {
  try {
    const uidRaw = req.query.uid
    const uid = Array.isArray(uidRaw) ? uidRaw[0] : uidRaw

    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'uid query parameter is required and must be a string' })
    }

    const bookings = await bookingsService.getUpcomingBookings(uid)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const search = async (req: Request, res: Response) => {
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