import prisma from '../../prisma/client.js'
import { sendNotification } from '../notifications/notifications.service.js'
import type {
  BoardingPassDto,
  GenerateBoardingPassResponse,
  GetAllBoardingPassesResponse,
  VerifyBoardingPassResponse,
} from '../../types/boarding.types.js'

function buildQrCode(passId: string): string {
  return `CHECKIN_PASS:${passId}`
}

function toDto(pass: {
  passId: string
  passengerId: string
  flightId: string
  seatNumber: string
  gate: string
  boardingTime: string
  terminal: string | null
  qrCode: string
  issuedAt: Date
  passenger: {
    firstName: string
    lastName: string
    checkinStatus: string
    booking: {
      bookingId: string
      bookingRef: string
    }
  }
  flight: {
    flightNumber: string
    origin: string
    originCity: string
    destination: string
    destinationCity: string
    departureTime: Date
    arrivalTime: Date
  }
}): BoardingPassDto {
  return {
    passId: pass.passId,
    passengerId: pass.passengerId,
    flightId: pass.flightId,
    flightNumber: pass.flight.flightNumber,
    origin: pass.flight.origin,
    originCity: pass.flight.originCity,
    destination: pass.flight.destination,
    destinationCity: pass.flight.destinationCity,
    passengerName: `${pass.passenger.firstName} ${pass.passenger.lastName}`,
    seatNumber: pass.seatNumber,
    gate: pass.gate,
    boardingTime: pass.boardingTime,
    terminal: pass.terminal,
    departureTime: pass.flight.departureTime.toISOString(),
    arrivalTime: pass.flight.arrivalTime.toISOString(),
    bookingReference: pass.passenger.booking.bookingRef,
    qrCode: pass.qrCode,
    issuedAt: pass.issuedAt.toISOString(),
  }
}

const BOARDING_PASS_INCLUDE = {
  passenger: {
    include: {
      booking: {
        select: { bookingId: true, bookingRef: true },
      },
    },
  },
  flight: true,
} as const

export async function generateBoardingPass(
  passengerId: string
): Promise<GenerateBoardingPassResponse> {
  const session = await prisma.checkInSession.findUnique({
    where: { passengerId },
    include: {
      passenger: {
        include: {
          booking: {
            include: { flight: true },
          },
        },
      },
    },
  })

  if (!session) throw new Error('No check-in session found for this passenger')

  const ALLOWED_STEPS = ['PREFERENCES_COMPLETED', 'BAGGAGE_DECLARATION', 'COMPLETED']
  if (!ALLOWED_STEPS.includes(session.currentStep)) {
    throw new Error(`Check-in is not yet complete. Current step: ${session.currentStep}`)
  }

  const passenger = session.passenger
  const flight = passenger.booking.flight

  if (!passenger.seatNumber) throw new Error('Passenger has no assigned seat')
  if (!flight.gate || !flight.boardingTime) throw new Error('Flight gate or boarding time is missing')

  const passId = `BP-${passengerId}`
  const qrCode = buildQrCode(passId)

  await prisma.boardingPass.upsert({
    where: { passengerId },
    create: {
      passId,
      passengerId,
      uid: session.uid,
      flightId: flight.flightId,
      qrCode,
      seatNumber: passenger.seatNumber,
      gate: flight.gate,
      boardingTime: flight.boardingTime,
      terminal: flight.terminal ?? null,
    },
    update: {
      qrCode,
      seatNumber: passenger.seatNumber,
      gate: flight.gate,
      boardingTime: flight.boardingTime,
      terminal: flight.terminal ?? null,
      issuedAt: new Date(),
    },
  })

  await prisma.checkInSession.update({
    where: { passengerId },
    data: { currentStep: 'COMPLETED', completedAt: new Date() },
  })

  await prisma.passenger.update({
    where: { passengerId },
    data: { checkinStatus: 'CHECKED_IN' },
  })

  await prisma.booking.update({
    where: { bookingId: passenger.booking.bookingId },
    data: { status: 'CHECKED_IN' },
  })

  const fullPass = await prisma.boardingPass.findUniqueOrThrow({
    where: { passengerId },
    include: BOARDING_PASS_INCLUDE,
  })

  try {
    await sendNotification({
      uid: fullPass.uid,
      passengerId,
      flightId: fullPass.flightId,
      bookingId: fullPass.passenger.booking.bookingId,
      boardingPassId: fullPass.passId,
      title: 'Check-in completed',
      body: 'Your boarding pass is ready',
      type: 'BOARDING',
      screen: 'boarding_pass',
    })
  } catch (error) {
    console.error('[Boarding] Failed to send boarding notification:', error)
  }

  return { success: true, message: 'Boarding pass generated successfully', data: toDto(fullPass) }
}

export async function getBoardingPassByUid(
  uid: string
): Promise<GenerateBoardingPassResponse> {
  const pass = await prisma.boardingPass.findFirst({
    where: { uid },
    orderBy: { issuedAt: 'desc' },
    include: BOARDING_PASS_INCLUDE,
  })

  if (!pass) throw new Error('No boarding pass found for this account')

  return { success: true, message: 'Boarding pass retrieved', data: toDto(pass) }
}

/**
 * Returns ALL boarding passes for the authenticated user.
 * Used by the mobile sync worker to keep SQLite up to date.
 */
export async function getAllBoardingPassesByUid(
  uid: string
): Promise<GetAllBoardingPassesResponse> {
  const passes = await prisma.boardingPass.findMany({
    where: { uid },
    orderBy: { issuedAt: 'desc' },
    include: BOARDING_PASS_INCLUDE,
  })

  return { success: true, message: 'Boarding passes retrieved', data: passes.map(toDto) }
}

export async function verifyBoardingPass(passId: string): Promise<VerifyBoardingPassResponse> {
  const pass = await prisma.boardingPass.findUnique({
    where: { passId },
    include: {
      passenger: { include: { booking: true } },
      flight: true,
    },
  })

  if (!pass) return { success: true, valid: false, message: 'Boarding pass not found' }

  const passenger = pass.passenger
  const booking = passenger.booking
  const isValid = passenger.checkinStatus === 'CHECKED_IN' && passenger.booking.flightId === pass.flightId

  if (!isValid) {
    return {
      success: true,
      valid: false,
      message: `Boarding pass invalid. Passenger status: ${passenger.checkinStatus}`,
    }
  }

  return {
    success: true,
    valid: true,
    message: 'Boarding pass is valid',
    data: {
      passId: pass.passId,
      passengerName: `${passenger.firstName} ${passenger.lastName}`,
      flightNumber: pass.flight.flightNumber,
      origin: pass.flight.origin,
      destination: pass.flight.destination,
      seatNumber: pass.seatNumber,
      gate: pass.gate,
      boardingTime: pass.boardingTime,
      departureTime: pass.flight.departureTime.toISOString(),
      bookingReference: booking.bookingRef,
      bookingStatus: (booking as any).status,
      checkinStatus: passenger.checkinStatus,
    },
  }
}
