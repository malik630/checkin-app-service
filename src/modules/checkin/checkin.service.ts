import prisma from '../../prisma/client.js'

import type {
  SaveBaggageRequest,
  GetBaggageResponse,
  SaveBaggageResponse,
  CreateSessionResponse,
  UpdateStepResponse,
} from '../../types/checkin.types.js'

// Helpers

const normalizeDate = (dateStr: string): string => {
  const clean = dateStr.toUpperCase().trim()

  const isoMatch = clean.match(/(\d{4})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`

  const months: { [key: string]: string } = {
    JAN: '01', FEB: '02', FEV: '02', MAR: '03', APR: '04', AVR: '04',
    MAY: '05', MAI: '05', JUN: '06', JUIN: '06', JUL: '07', JUIL: '07',
    AUG: '08', AOUT: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  }

  const yearMatch = clean.match(/\d{4}/)
  const monthMatch = Object.keys(months).find(m => clean.includes(m))

  if (yearMatch && monthMatch) {
    return `${yearMatch[0]}-${months[monthMatch]}`
  }

  return clean
}

// Session

export async function createOrResumeSession(
  passengerId: string,
  bookingId: string
): Promise<CreateSessionResponse> {
  const passenger = await prisma.passenger.findFirst({
    where: { passengerId, bookingId },
    include: {
      booking: {
        include: { flight: true },
      },
    },
  })

  if (!passenger) {
    throw new Error('Passenger not found for this booking')
  }

  const departureTime = passenger.booking.flight.departureTime
  const now = new Date()
  /*const hoursUntilDeparture =
    (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilDeparture > 24) {
    const opensAt = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000)
    throw new Error(
      `Check-in is not yet open. It opens at: ${opensAt.toISOString()}`
    )
  }

  if (hoursUntilDeparture < 0) {
    throw new Error('Check-in is closed. The flight has already departed.')
  }*/

  const existing = await prisma.checkInSession.findUnique({
    where: { passengerId },
  })

  if (existing) {
    return {
      success: true,
      message: 'Session resumed',
      data: {
        sessionId: existing.sessionId,
        passengerId: existing.passengerId,
        bookingId: existing.bookingId,
        currentStep: existing.currentStep,
      },
    }
  }

  const session = await prisma.checkInSession.create({
    data: {
      passengerId,
      bookingId,
      currentStep: 'PASSPORT_SCAN',
    },
  })

  return {
    success: true,
    message: 'Check-in session created',
    data: {
      sessionId: session.sessionId,
      passengerId: session.passengerId,
      bookingId: session.bookingId,
      currentStep: session.currentStep,
    },
  }
}

export async function advanceSessionStep(
  passengerId: string,
  step: string
): Promise<UpdateStepResponse> {
  const VALID_STEPS = [
    'PASSPORT_SCAN',
    'DETAILS_REVIEW',
    'SEAT_SELECTION',
    'BAGGAGE_DECLARATION',
    'SPECIAL_REQUESTS',
    'COMPLETED',
  ]

  if (!VALID_STEPS.includes(step)) {
    throw new Error(`Invalid step: ${step}. Valid steps are: ${VALID_STEPS.join(', ')}`)
  }

  const session = await prisma.checkInSession.findUnique({
    where: { passengerId },
  })

  if (!session) {
    throw new Error('Check-in session not found')
  }

  const updated = await prisma.checkInSession.update({
    where: { passengerId },
    data: { currentStep: step },
  })

  return {
    success: true,
    data: {
      sessionId: updated.sessionId,
      currentStep: updated.currentStep,
    },
  }
}

// Passport Verification

export const verifyPassport = async (
  passportNumber: string,
  lastName: string,
  firstName?: string,
  nationality?: string,
  dateOfBirth?: string,
  expiryDate?: string
) => {
  const normalizedDob = dateOfBirth ? normalizeDate(dateOfBirth) : null
  const normalizedExpiry = expiryDate ? normalizeDate(expiryDate) : null

  console.log('--- VERIFYING PASSPORT ---')
  console.log('Passport:', passportNumber)
  console.log('Last Name:', lastName)
  console.log('Normalized DOB:', normalizedDob)
  console.log('Normalized Expiry:', normalizedExpiry)

  const passenger = await prisma.passenger.findFirst({
    where: {
      passportNumber: {
        equals: passportNumber.trim(),
        mode: 'insensitive',
      },
      lastName: {
        equals: lastName.trim(),
        mode: 'insensitive',
      },
    },
  })

  if (!passenger) {
    console.log('Result: PASSENGER NOT FOUND (Checked Passport + LastName only)')
  } else {
    console.log('Result: FOUND PASSENGER', passenger.firstName, passenger.lastName)
  }

  return passenger
}

// Baggage Declaration

export async function saveBaggageDeclaration(
  passengerId: string,
  body: SaveBaggageRequest
): Promise<SaveBaggageResponse> {
  if (!passengerId) throw new Error('Passenger ID is required')
  if (!body) throw new Error('Baggage declaration is required')

  const checkedBaggageCount = validateBaggageCount(
    body.checkedBaggageCount,
    'checkedBaggageCount'
  )
  const specialEquipmentCount = validateBaggageCount(
    body.specialEquipmentCount,
    'specialEquipmentCount'
  )

  const session = await prisma.checkInSession.findUnique({
    where: { passengerId },
  })

  if (!session) throw new Error('Check-in session not found')

  const updatedSession = await prisma.checkInSession.update({
    where: { passengerId },
    data: {
      checkedBaggageCount,
      specialEquipmentCount,
      currentStep: 'BAGGAGE_DECLARATION',
    },
  })

  return {
    success: true,
    message: 'Baggage declaration saved',
    data: {
      sessionId: updatedSession.sessionId,
      passengerId: updatedSession.passengerId,
      baggageDeclaration: {
        checkedBaggageCount: updatedSession.checkedBaggageCount,
        specialEquipmentCount: updatedSession.specialEquipmentCount,
      },
      currentStep: updatedSession.currentStep,
    },
  }
}

export async function getBaggageDeclaration(
  passengerId: string
): Promise<GetBaggageResponse> {
  if (!passengerId) throw new Error('Passenger ID is required')

  const session = await prisma.checkInSession.findUnique({
    where: { passengerId },
  })

  if (!session) {
    return {
      success: true,
      data: {
        checkedBaggageCount: 0,
        specialEquipmentCount: 0,
      },
    }
  }

  return {
    success: true,
    data: {
      checkedBaggageCount: session.checkedBaggageCount,
      specialEquipmentCount: session.specialEquipmentCount,
    },
  }
}

function validateBaggageCount(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return value
}