import prisma from '../../prisma/client.js'
import type { SelectedSeatDto, SelectSeatRequest, SeatMapDto } from '../../types/seat.types.js'

interface HttpError extends Error {
  statusCode: number
}

const createHttpError = (message: string, statusCode: number): HttpError => {
  const error = new Error(message) as HttpError
  error.statusCode = statusCode
  return error
}

export const getSeatMap = async (flightId: string): Promise<SeatMapDto[]> => {
  if (!flightId) {
    throw new Error('Flight ID is required')
  }

  console.log(`[SeatsService] Fetching seat map from database for flightId=${flightId}`)

  const seats = await prisma.seatMap.findMany({
    where: { flightId },
    orderBy: { seatNumber: 'asc' },
  })

  const availableSeats = seats.filter(seat => seat.isAvailable).length
  console.log(
    `[SeatsService] Seat map loaded for flightId=${flightId}: total=${seats.length}, available=${availableSeats}, occupied=${seats.length - availableSeats}`
  )

  return seats.map((seat) => ({
    seatId: seat.seatId,
    flightId: seat.flightId,
    seatNumber: seat.seatNumber,
    seatClass: seat.seatClass,
    isAvailable: seat.isAvailable,
    isPremium: seat.isPremium,
    occupiedBy: seat.occupiedBy,
  }))
}

export const selectSeat = async (
  passengerId: string,
  uid: string,
  body: SelectSeatRequest
): Promise<SelectedSeatDto> => {
  if (!passengerId) {
    throw new Error('Passenger ID is required')
  }

  if (!uid) {
    throw new Error('User ID is required')
  }

  console.log(
    `[SeatsService] Starting seat selection passengerId=${passengerId} requestedSeat=${body.seatNumber} uid=${uid}`
  )

  const passenger = await prisma.passenger.findUnique({
    where: { passengerId },
    include: {
      booking: {
        select: {
          bookingId: true,
          flightId: true,
          uid: true,
          checkinSessionId: true,
        },
      },
    },
  })

  if (!passenger) {
    console.warn(`[SeatsService] Passenger not found for passengerId=${passengerId}`)
    throw createHttpError('Passenger not found', 404)
  }

  console.log(
    `[SeatsService] Passenger loaded passengerId=${passengerId} bookingId=${passenger.booking.bookingId} flightId=${passenger.booking.flightId} previousSeat=${passenger.seatNumber ?? 'none'}`
  )

  if (passenger.booking.uid !== uid) {
    console.warn(`[SeatsService] Passenger ${passengerId} does not belong to uid=${uid}`)
    throw createHttpError('Passenger does not belong to this user', 403)
  }

  const flightId = passenger.booking.flightId
  const seatNumber = body.seatNumber

  const seat = await prisma.seatMap.findUnique({
    where: {
      flightId_seatNumber: {
        flightId,
        seatNumber,
      },
    },
  })

  if (!seat) {
    console.warn(`[SeatsService] Seat ${seatNumber} not found for flightId=${flightId}`)
    throw createHttpError('Seat not found for this flight', 404)
  }

  if (!seat.isAvailable && seat.occupiedBy !== passengerId) {
    console.warn(
      `[SeatsService] Seat ${seatNumber} on flightId=${flightId} is occupiedBy=${seat.occupiedBy}`
    )
    throw createHttpError('Seat is already occupied', 409)
  }

  const previousSeatNumber = passenger.seatNumber

  const { selectedSeat, checkInSession } = await prisma.$transaction(async (tx) => {
    if (previousSeatNumber && previousSeatNumber !== seatNumber) {
      console.log(
        `[SeatsService] Releasing previous seat ${previousSeatNumber} for passengerId=${passengerId}`
      )

      await tx.seatMap.update({
        where: {
          flightId_seatNumber: {
            flightId,
            seatNumber: previousSeatNumber,
          },
        },
        data: {
          isAvailable: true,
          occupiedBy: null,
        },
      })
    }

    const selectedSeat = await tx.seatMap.update({
      where: {
        flightId_seatNumber: {
          flightId,
          seatNumber,
        },
      },
      data: {
        isAvailable: false,
        occupiedBy: passengerId,
      },
    })

    await tx.passenger.update({
      where: { passengerId },
      data: { seatNumber },
    })

    let checkInSession = body.checkinSessionId
      ? await tx.checkInSession.findUnique({
          where: { sessionId: body.checkinSessionId },
        })
      : await tx.checkInSession.findUnique({
          where: { passengerId },
        })

    if (body.checkinSessionId && !checkInSession) {
      throw createHttpError('Check-in session not found', 404)
    }

    if (checkInSession && checkInSession.passengerId !== passengerId) {
      throw createHttpError('Check-in session does not belong to this passenger', 409)
    }

    if (checkInSession && checkInSession.uid !== uid) {
      throw createHttpError('Check-in session does not belong to this user', 403)
    }

    if (!checkInSession) {
      console.log(`[SeatsService] Creating check-in session for passengerId=${passengerId}`)
      checkInSession = await tx.checkInSession.create({
        data: {
          passengerId,
          uid,
          currentStep: 'SEAT_SELECTION',
        },
      })
    } else if (!['COMPLETED', 'PREFERENCES_COMPLETED'].includes(checkInSession.currentStep)) {
      console.log(
        `[SeatsService] Updating check-in session ${checkInSession.sessionId} to SEAT_SELECTION`
      )

      checkInSession = await tx.checkInSession.update({
        where: { sessionId: checkInSession.sessionId },
        data: { currentStep: 'SEAT_SELECTION' },
      })
    }

    if (passenger.booking.checkinSessionId !== checkInSession.sessionId) {
      console.log(
        `[SeatsService] Linking bookingId=${passenger.booking.bookingId} to checkinSessionId=${checkInSession.sessionId}`
      )

      await tx.booking.update({
        where: { bookingId: passenger.booking.bookingId },
        data: { checkinSessionId: checkInSession.sessionId },
      })
    }

    return { selectedSeat, checkInSession }
  })

  console.log(
    `[SeatsService] Seat selected passengerId=${passengerId} flightId=${selectedSeat.flightId} seatNumber=${selectedSeat.seatNumber} checkinSessionId=${checkInSession.sessionId}`
  )

  return {
    seatId: selectedSeat.seatId,
    flightId: selectedSeat.flightId,
    seatNumber: selectedSeat.seatNumber,
    seatClass: selectedSeat.seatClass,
    isAvailable: selectedSeat.isAvailable,
    isPremium: selectedSeat.isPremium,
    occupiedBy: selectedSeat.occupiedBy,
    passengerId,
    bookingId: passenger.booking.bookingId,
    userId: uid,
    uid,
    checkinSessionId: checkInSession.sessionId,
    currentStep: checkInSession.currentStep,
  }
}
