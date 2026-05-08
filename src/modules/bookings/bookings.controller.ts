import { Request, Response } from 'express'
import * as bookingsService from './bookings.service.js'

export const getMany = async (req: Request, res: Response) => {
  try {
    const { uid } = req.query
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    const bookings = await bookingsService.getAllBookings(uid as string)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const getUpcoming = async (req: Request, res: Response) => {
  try {
    const { uid } = req.query
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    const bookings = await bookingsService.getUpcomingBookings(uid as string)
    res.json(bookings)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
