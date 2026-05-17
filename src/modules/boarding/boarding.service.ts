import prisma from '../../prisma/client.js'
import type {
  BoardingPassDto,
  GenerateBoardingPassResponse,
  VerifyBoardingPassResponse,
} from '../../types/boarding.types.js'

// Helpers

/*
  Builds the QR code payload stored in the boarding pass.
  The QR contains only the passId so the scanner must call
  POST /api/boarding/verify to resolve flight data server-side.
 */
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
        select: { bookingRef: true },
      },
    },
  },
  flight: true,
} as const

// Generate Boarding Pass

/**
 * Called after step 5 (special requests) of the check-in flow.
 * - Verifies the check-in session is complete (step = SPECIAL_REQUESTS).
 * - Creates or replaces the boarding pass in the DB.
 * - Marks the passenger checkinStatus as CHECKED_IN.
 * - Returns the full boarding pass DTO.
 */
export async function generateBoardingPass(
  passengerId: string
): Promise<GenerateBoardingPassResponse> {
  // 1. Load the check-in session and verify it reached the final step
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

  if (!session) {
    throw new Error('No check-in session found for this passenger')
  }

  const ALLOWED_STEPS = [
    'SPECIAL_REQUESTS',
    'BAGGAGE_DECLARATION', // fallback: allow if baggage was the last completed step
    'COMPLETED',
  ]

  if (!ALLOWED_STEPS.includes(session.currentStep)) {
    throw new Error(
      `Check-in is not yet complete. Current step: ${session.currentStep}`
    )
  }

  const passenger = session.passenger
  const flight = passenger.booking.flight

  if (!passenger.seatNumber) {
    throw new Error('Passenger has no assigned seat')
  }

  if (!flight.gate || !flight.boardingTime) {
    throw new Error('Flight gate or boarding time is missing')
  }

  // 2. Build a deterministic passId so upsert is idempotent
  const passId = `BP-${passengerId}`
  const qrCode = buildQrCode(passId)

  // 3. Upsert boarding pass (create or replace on re-check-in)
  await prisma.boardingPass.upsert({
    where: { passengerId },
    create: {
      passId,
      passengerId,
      flightId: flight.flightId,
      qrCode,
      seatNumber: passenger.seatNumber,
      gate: flight.gate,
      boardingTime: flight.boardingTime,
      terminal: flight.terminal ?? null,
    },
    update: {
      // Re-generate in case seat or gate changed
      qrCode,
      seatNumber: passenger.seatNumber,
      gate: flight.gate,
      boardingTime: flight.boardingTime,
      terminal: flight.terminal ?? null,
      issuedAt: new Date(),
    },
  })

  // 4. Mark the session as COMPLETED and the passenger as CHECKED_IN
  await prisma.checkInSession.update({
    where: { passengerId },
    data: { currentStep: 'COMPLETED', completedAt: new Date() },
  })

  await prisma.passenger.update({
    where: { passengerId },
    data: { checkinStatus: 'CHECKED_IN' },
  })

  // 5. Reload the full pass with relations for the DTO
  const fullPass = await prisma.boardingPass.findUniqueOrThrow({
    where: { passengerId },
    include: BOARDING_PASS_INCLUDE,
  })

  return {
    success: true,
    message: 'Boarding pass generated successfully',
    data: toDto(fullPass),
  }
}

//Get Boarding Pass

/**
 * Returns the boarding pass for the authenticated passenger
 * (identified via the JWT uid → passenger lookup).
 */
export async function getBoardingPassByUid(
  uid: string
): Promise<GenerateBoardingPassResponse> {
  // A user may have several passengers but we return the most recent active one
  const passenger = await prisma.passenger.findFirst({
    where: { uid, checkinStatus: 'CHECKED_IN' },
    orderBy: { booking: { createdAt: 'desc' } },
  })

  if (!passenger) {
    throw new Error('No checked-in passenger found for this account')
  }

  const pass = await prisma.boardingPass.findUnique({
    where: { passengerId: passenger.passengerId },
    include: BOARDING_PASS_INCLUDE,
  })

  if (!pass) {
    throw new Error('Boarding pass not found')
  }

  return {
    success: true,
    message: 'Boarding pass retrieved',
    data: toDto(pass),
  }
}

// Verify Boarding Pass (QR scan endpoint)

/**
 * Called by a QR scanner (gate agent, security app, etc.).
 * Receives the passId extracted from the QR code payload
 * "CHECKIN_PASS:<passId>" and validates the reservation.
 */
export async function verifyBoardingPass(
  passId: string
): Promise<VerifyBoardingPassResponse> {
  const pass = await prisma.boardingPass.findUnique({
    where: { passId },
    include: BOARDING_PASS_INCLUDE,
  })

  if (!pass) {
    return {
      success: true,
      valid: false,
      message: 'Boarding pass not found',
    }
  }

  const passenger = pass.passenger
  const booking = passenger.booking

  // Validate: passenger must be CHECKED_IN and booking must be CONFIRMED
  const isValid =
    passenger.checkinStatus === 'CHECKED_IN' &&
    (booking as any).status === 'CONFIRMED'

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