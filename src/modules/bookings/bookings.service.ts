import prisma from '../../prisma/client.js'

export const getAllBookings = async () => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  try {
    const bookings = await prisma.booking.findMany({ 
      where: {
        status: { not: 'CHECKED_IN' },
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
        createdAt: 'desc',
      },
    })
    return bookings
  } catch (error) {
    console.error('getAllBookings error:', error)
    throw error
  }
}

export const getUpcomingBookings = async (uid: string) => {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        checkinSession: { uid },
        flight: {
          departureTime: { gte: threeDaysAgo },
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