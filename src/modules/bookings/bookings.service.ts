import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllBookings = async (uid: string) => {
  return await prisma.booking.findMany({
    where: { uid },
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
  return await prisma.booking.findMany({
    where: {
      uid,
      flight: {
        departureTime: {
          gt: now,
        },
      },
    },
    include: {
      flight: true,
      passengers: true,
    },
    orderBy: {
      flight: {
        departureTime: 'asc',
      },
    },
  })
}
