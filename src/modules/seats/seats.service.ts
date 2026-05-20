import prisma from '../../prisma/client.js'
import type { SelectSeatRequest, SeatMapDto } from '../../types/seat.types.js'

export const getSeatMap = async (flightId: string): Promise<SeatMapDto[]> => {
  if (!flightId) {
    throw new Error('Flight ID is required')
  }

  const seats = await prisma.seatMap.findMany({
    where: { flightId },
    orderBy: { seatNumber: 'asc' },
  })

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
  body: SelectSeatRequest
): Promise<SeatMapDto> => {
  if (!passengerId) {
    throw new Error('Passenger ID is required')
  }

  const passenger = await prisma.passenger.findUnique({
    where: { passengerId },
    include: { booking: { select: { flightId: true } } },
  })

  if (!passenger) {
    const error = new Error('Passenger not found')
    ;(error as any).statusCode = 404
    throw error
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
    const error = new Error('Seat not found for this flight')
    ;(error as any).statusCode = 404
    throw error
  }

  if (!seat.isAvailable && seat.occupiedBy !== passengerId) {
    const error = new Error('Seat is already occupied')
    ;(error as any).statusCode = 409
    throw error
  }

  const previousSeatNumber = passenger.seatNumber

  const updatedSeat = await prisma.$transaction(async (tx) => {
    if (previousSeatNumber && previousSeatNumber !== seatNumber) {
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

    return selectedSeat
  })

  return {
    seatId: updatedSeat.seatId,
    flightId: updatedSeat.flightId,
    seatNumber: updatedSeat.seatNumber,
    seatClass: updatedSeat.seatClass,
    isAvailable: updatedSeat.isAvailable,
    isPremium: updatedSeat.isPremium,
    occupiedBy: updatedSeat.occupiedBy,
  }
}
