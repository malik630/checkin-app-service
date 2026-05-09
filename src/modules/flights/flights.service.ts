import prisma from '../../prisma/client.js'

export const getFlightById = async (flightId: string) => {
  return await prisma.flight.findUnique({
    where: { flightId },
  })
}

export const getAllFlights = async () => {
  return await prisma.flight.findMany()
}