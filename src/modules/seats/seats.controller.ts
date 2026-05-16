import { Request, Response } from 'express'
import * as seatsService from './seats.service.js'
import type { SelectSeatRequest, SeatMapDto } from '../../types/seat.types.js'

export const getSeatMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightId } = req.params
    const id = Array.isArray(flightId) ? flightId[0] : flightId
    const seats: SeatMapDto[] = await seatsService.getSeatMap(id)
    res.status(200).json(seats)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const selectSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId } = req.params
    const id = Array.isArray(passengerId) ? passengerId[0] : passengerId
    const body: SelectSeatRequest = req.body

    if (!body?.seatNumber) {
      return res.status(400).json({ message: 'seatNumber is required' })
    }

    const updatedSeat: SeatMapDto = await seatsService.selectSeat(id, body)
    res.status(200).json(updatedSeat)
  } catch (error: any) {
    const status = error.statusCode || 400
    res.status(status).json({ message: error.message })
  }
}
