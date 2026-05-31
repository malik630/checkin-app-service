import { Request, Response } from 'express'
import * as seatsService from './seats.service.js'
import type { SelectSeatRequest, SeatMapDto, SelectedSeatDto } from '../../types/seat.types.js'
import type { AuthenticatedRequest } from '../../types/index.js'

export const getSeatMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const { flightId } = req.params
    const id = Array.isArray(flightId) ? flightId[0] : flightId
    console.log(`[Seats] Received seat map fetch request for flightId=${id}`)

    const seats: SeatMapDto[] = await seatsService.getSeatMap(id)
    console.log(`[Seats] Seat map fetch success flightId=${id} seats=${seats.length} STATUS 200`)

    res.status(200).json(seats)
  } catch (error: any) {
    console.error(`[Seats] Seat map fetch failed STATUS 500 message=${error.message}`)
    res.status(500).json({ message: error.message })
  }
}

export const selectSeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { passengerId } = req.params
    const id = Array.isArray(passengerId) ? passengerId[0] : passengerId
    const body: SelectSeatRequest = req.body
    const authenticatedUid = (req as AuthenticatedRequest).user?.uid
    const requestedUid = body?.uid ?? body?.userId
    const uid = requestedUid ?? authenticatedUid

    console.log(
      `[Seats] Received seat selection request passengerId=${id} seatNumber=${body?.seatNumber ?? 'missing'} uid=${uid ?? 'missing'} checkinSessionId=${body?.checkinSessionId ?? 'auto'}`
    )

    if (!body?.seatNumber || typeof body.seatNumber !== 'string') {
      console.warn(`[Seats] Rejected seat selection passengerId=${id} STATUS 400 reason=missing-seatNumber`)
      res.status(400).json({ message: 'seatNumber is required' })
      return
    }

    if (!uid || typeof uid !== 'string') {
      console.warn(`[Seats] Rejected seat selection passengerId=${id} STATUS 400 reason=missing-userId`)
      res.status(400).json({ message: 'userId is required' })
      return
    }

    if (requestedUid && authenticatedUid && requestedUid !== authenticatedUid) {
      console.warn(`[Seats] Rejected seat selection passengerId=${id} STATUS 403 reason=uid-mismatch`)
      res.status(403).json({ message: 'userId does not match authenticated user' })
      return
    }

    if (body.checkinSessionId && typeof body.checkinSessionId !== 'string') {
      console.warn(`[Seats] Rejected seat selection passengerId=${id} STATUS 400 reason=invalid-checkinSessionId`)
      res.status(400).json({ message: 'checkinSessionId must be a string' })
      return
    }

    const updatedSeat: SelectedSeatDto = await seatsService.selectSeat(id, uid, body)
    console.log(
      `[Seats] Seat selection success passengerId=${id} seatNumber=${updatedSeat.seatNumber} flightId=${updatedSeat.flightId} checkinSessionId=${updatedSeat.checkinSessionId} STATUS 200`
    )

    res.status(200).json(updatedSeat)
  } catch (error: any) {
    const status = error.statusCode || 400
    console.error(`[Seats] Seat selection failed passengerId=${req.params.passengerId} STATUS ${status} message=${error.message}`)
    res.status(status).json({ message: error.message })
  }
}
