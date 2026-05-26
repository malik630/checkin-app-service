import prisma from '../../prisma/client.js'

export const getAllBookings = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const bookings = await prisma.booking.findMany({ 
      where: {
        flight: {
          departureTime: {
            gte: threeDaysAgo
          }
        }
      },
      include: {
        flight: true,
        passengers: true,
      },
      orderBy: {
        flight: {
          departureTime: 'desc',
        },
      },
      distinct: ['flightId'],
    })
    return bookings
  } catch (error) {
    console.error('getAllBookings error:', error)
    throw error
  }
}
export const getUpcomingBookings = async (uid: string) => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    // 1. Fetch check-in sessions by user id
    const sessions = await prisma.checkInSession.findMany({
      where: { uid },
      select: { sessionId: true }
    })
    const sessionIds = sessions.map(s => s.sessionId)

    // 2. Fetch bookings by check-in session ID
    const bookings = await prisma.booking.findMany({
      where: {
        checkinSessionId: { in: sessionIds },
        //status: 'CHECKED_IN',
        flight: {
          departureTime: { gt: threeDaysAgo },
        },
      },
      include: {
        flight: true,
        passengers: true,
        checkinSession: {
          select: { passengerId: true }
        }
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