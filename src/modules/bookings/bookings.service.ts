import prisma from '../../prisma/client.js'

export const getAllBookings = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const bookings = await prisma.booking.findMany({
      where: {
        flight: {
          departureTime: {
            gte: threeDaysAgo,
          },
        },
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