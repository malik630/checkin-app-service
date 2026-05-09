import prisma from '../../prisma/client.js'

export const getAllBookings = async (uid: string) => {
  return await prisma.booking.findMany({ 
    where : { uid },
    include: {
      flight: true,
      passengers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const getUpcomingBookings = async (uid: string) => {
  const now = new Date()
  try {
    return await prisma.booking.findMany({
      where: {
        uid,
        flight: {
          departureTime: { gt: now },
        },
      },
      include: {
        flight: true,
        passengers: true,
      },
      orderBy: {
        flight: { departureTime: 'asc' },
      },
    })
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