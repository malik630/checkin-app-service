import prisma from '../../prisma/client.js'

export const getAllBookings = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const flights = await prisma.flight.findMany({
      where: {
        departureTime: {
          gte: threeDaysAgo,
        },
      },
      orderBy: {
        departureTime: 'desc',
      },
    })

    const now = new Date()
    const checkInThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const bookings = flights.map((flight) => {
      let flightStatus = 'CONFIRMED'
      if (flight.departureTime <= now) {
        flightStatus = 'PASSED'
      } else if (flight.departureTime <= checkInThreshold) {
        flightStatus = 'CHECK_IN_OPEN'
      }

      return {
        bookingId: flight.flightId,
        uid: '',
        pnr: 'FLIGHT',
        lastName: 'Flight',
        bookingRef: flight.flightId,
        status: flightStatus,
        checkinDeadline: new Date(flight.departureTime.getTime() - 45 * 60 * 1000),
        createdAt: flight.createdAt,
        flight: flight,
        passengers: [],
      }
    })

    return bookings
  } catch (error) {
    console.error('getAllBookings error:', error)
    throw error
  }
}


export const getUpcomingBookings = async (uid: string) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: 'PASSED' },
        checkinSession: {
          uid,
          currentStep: 'COMPLETED',
        },
      },
      include: {
        flight: true,
        passengers: true,
        checkinSession: {
          select: { passengerId: true, currentStep: true },
        },
      },
      orderBy: {
        flight: { departureTime: 'asc' },
      },
    })
    return bookings
  } catch (error) {
    console.error('getUpcomingBookings error:', error)
    throw error
  }
}

export const searchByPnrAndLastName = async (pnr: string, lastName: string) => {
  return await prisma.booking.findFirst({
    where: {
      OR: [
        { pnr: { equals: pnr.toUpperCase().trim() } },
        { bookingRef: { equals: pnr.toUpperCase().trim() } },
      ],
      lastName: {
        equals: lastName.trim(),
        mode: 'insensitive',
      },
    },
    include: {
      flight: true,
      passengers: true,
    },
  })
}
