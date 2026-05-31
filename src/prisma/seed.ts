import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with pristine test data...')

  // Clean up
  console.log('Clearing old tables...')
  try {
    await prisma.boardingPass.deleteMany()
    await prisma.checkInSession.deleteMany()
    await prisma.seatMap.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.passenger.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.flight.deleteMany()
    await prisma.preferences.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.deviceToken.deleteMany()
    await prisma.user.deleteMany()
    console.log('Tables cleared successfully.')
  } catch (error) {
    console.error('Cleanup failed:', error)
    throw error
  }

  const passwordHash = await bcrypt.hash('Password123!', 12)

  // Users
  const fatma = await prisma.user.create({
    data: {
      uid: 'user-fatma-001',
      email: 'fatma.djerfi@email.com',
      passwordHash,
      displayName: 'Djerfi Fatma',
      phoneNumber: '+213 555 001 001',
      provider: 'email',
    },
  })

  const melliti = await prisma.user.create({
    data: {
      uid: 'user-melliti-002',
      email: 'melliti.abdelmalek@email.com',
      passwordHash,
      displayName: 'Melliti Abdelmalek',
      phoneNumber: '+213 555 002 002',
      provider: 'email',
    },
  })

  const youcef = await prisma.user.create({
    data: {
      uid: 'user-youcef-003',
      email: 'youcef.benali@email.com',
      passwordHash,
      displayName: 'Benali Youcef',
      phoneNumber: '+213 555 003 003',
      provider: 'email',
    },
  })

  console.log('Users seeded.')

  const now = new Date()

  // Flight 1: AH1042 — CHECK_IN_OPEN (departure in 18h)
  const departure1 = new Date(now.getTime() + 18 * 60 * 60 * 1000)
  const arrival1 = new Date(departure1.getTime() + 3 * 60 * 60 * 1000)
  const flight1 = await prisma.flight.create({
    data: {
      flightId: 'flight-ah1042-001',
      flightNumber: 'AH 1042',
      origin: 'ALG',
      originCity: 'Algiers',
      destination: 'CDG',
      destinationCity: 'Paris',
      departureTime: departure1,
      arrivalTime: arrival1,
      aircraftType: 'Boeing 737-800',
      status: 'Scheduled',
      gate: 'A12',
      terminal: 'T1',
      boardingTime: '07:50',
      checkInOpensTime: '05:35',
    },
  })

  // Flight 2: AH2056 — CONFIRMED (departure in 2 days, Youcef only)
  const departure2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const arrival2 = new Date(departure2.getTime() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000)
  const flight2 = await prisma.flight.create({
    data: {
      flightId: 'flight-ah2056-002',
      flightNumber: 'AH 2056',
      origin: 'ORN',
      originCity: 'Oran',
      destination: 'LHR',
      destinationCity: 'London',
      departureTime: departure2,
      arrivalTime: arrival2,
      aircraftType: 'Airbus A330-200',
      status: 'Scheduled',
      gate: 'B05',
      terminal: 'T2',
      boardingTime: '09:30',
      checkInOpensTime: '07:15',
    },
  })

  // Flight 3: AH3099 — PASSED within 3 days (departed 1.5 days ago, Youcef only)
  const departure3 = new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000)
  const arrival3 = new Date(departure3.getTime() + 1.5 * 60 * 60 * 1000)
  const flight3 = await prisma.flight.create({
    data: {
      flightId: 'flight-ah3099-003',
      flightNumber: 'AH 3099',
      origin: 'ALG',
      originCity: 'Algiers',
      destination: 'IST',
      destinationCity: 'Istanbul',
      departureTime: departure3,
      arrivalTime: arrival3,
      aircraftType: 'Boeing 777-300ER',
      status: 'Scheduled',
      gate: 'C03',
      terminal: 'T3',
      boardingTime: '13:15',
      checkInOpensTime: '11:00',
    },
  })

  // Flight 4: AH4012 — PASSED older than 3 days (departed 5 days ago, Youcef only)
  const departure4 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const arrival4 = new Date(departure4.getTime() + 2 * 60 * 60 * 1000)
  const flight4 = await prisma.flight.create({
    data: {
      flightId: 'flight-ah4012-004',
      flightNumber: 'AH 4012',
      origin: 'ALG',
      originCity: 'Algiers',
      destination: 'MRS',
      destinationCity: 'Marseille',
      departureTime: departure4,
      arrivalTime: arrival4,
      aircraftType: 'Airbus A320',
      status: 'Scheduled',
      gate: 'A02',
      terminal: 'T1',
      boardingTime: '15:00',
      checkInOpensTime: '12:45',
    },
  })

  console.log('Flights seeded.')

  // Bookings
  // Fatma: 1 booking on AH1042 (CHECK_IN_OPEN)
  const booking1 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-001',
      uid: fatma.uid,
      flightId: flight1.flightId,
      pnr: 'FATMA1',
      lastName: 'Djerfi',
      bookingRef: 'FATMA1',
      status: 'CHECK_IN_OPEN',
      checkinDeadline: new Date(departure1.getTime() - 45 * 60 * 1000),
    },
  })

  // Melliti: booking on same AH1042 flight (CHECK_IN_OPEN)
  const booking2 = await prisma.booking.create({
    data: {
      bookingId: 'booking-melliti-001',
      uid: melliti.uid,
      flightId: flight1.flightId,
      pnr: 'MELLITI1',
      lastName: 'MELLITI',
      bookingRef: 'MELLITI1',
      status: 'CHECK_IN_OPEN',
      checkinDeadline: new Date(departure1.getTime() - 45 * 60 * 1000),
    },
  })

  // Youcef: 3 bookings on extra flights
  const booking3 = await prisma.booking.create({
    data: {
      bookingId: 'booking-youcef-001',
      uid: youcef.uid,
      flightId: flight2.flightId,
      pnr: 'YOUCEF1',
      lastName: 'Benali',
      bookingRef: 'YOUCEF1',
      status: 'CONFIRMED',
      checkinDeadline: new Date(departure2.getTime() - 60 * 60 * 1000),
    },
  })

  const booking4 = await prisma.booking.create({
    data: {
      bookingId: 'booking-youcef-002',
      uid: youcef.uid,
      flightId: flight3.flightId,
      pnr: 'YOUCEF2',
      lastName: 'Benali',
      bookingRef: 'YOUCEF2',
      status: 'PASSED',
      checkinDeadline: new Date(departure3.getTime() - 60 * 60 * 1000),
    },
  })

  const booking5 = await prisma.booking.create({
    data: {
      bookingId: 'booking-youcef-003',
      uid: youcef.uid,
      flightId: flight4.flightId,
      pnr: 'YOUCEF3',
      lastName: 'Benali',
      bookingRef: 'YOUCEF3',
      status: 'PASSED',
      checkinDeadline: new Date(departure4.getTime() - 60 * 60 * 1000),
    },
  })

  console.log('Bookings seeded.')

  // Passengers
  const passenger1 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-fatma-001',
      bookingId: booking1.bookingId,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: '307840430',
      nationality: 'Algerian',
      dateOfBirth: '2004-05-30',
      expiryDate: '2027-07-24',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  const passenger2 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-melliti-001',
      bookingId: booking2.bookingId,
      firstName: 'Abdelmalek',
      lastName: 'MELLITI',
      passportNumber: '196118578',
      nationality: 'Algerian',
      dateOfBirth: '2004-12-25',
      expiryDate: '2026-01-22',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  // Youcef passengers
  await prisma.passenger.create({
    data: {
      passengerId: 'passenger-youcef-001',
      bookingId: booking3.bookingId,
      firstName: 'Youcef',
      lastName: 'Benali',
      passportNumber: '512345678',
      nationality: 'Algerian',
      dateOfBirth: '1990-03-15',
      expiryDate: '2028-03-15',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  await prisma.passenger.create({
    data: {
      passengerId: 'passenger-youcef-002',
      bookingId: booking4.bookingId,
      firstName: 'Youcef',
      lastName: 'Benali',
      passportNumber: '512345678',
      nationality: 'Algerian',
      dateOfBirth: '1990-03-15',
      expiryDate: '2028-03-15',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  await prisma.passenger.create({
    data: {
      passengerId: 'passenger-youcef-003',
      bookingId: booking5.bookingId,
      firstName: 'Youcef',
      lastName: 'Benali',
      passportNumber: '512345678',
      nationality: 'Algerian',
      dateOfBirth: '1990-03-15',
      expiryDate: '2028-03-15',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  console.log('Passengers seeded.')
  console.log('Check-in sessions seeded.')
  console.log('Boarding passes seeded.')

  // Preferences for Fatma
  await prisma.preferences.create({
    data: {
      uid: fatma.uid,
      preferredSoutien: true,
      preferredVisualsAudit: false,
      preferredChildCare: false,
      preferredPetCare: false,
      mealPreference: true,
    },
  })

  console.log('Preferences seeded.')

  // Seat maps
  console.log('Generating seat maps...')
  const flightsToSeat = [flight1.flightId, flight2.flightId, flight3.flightId, flight4.flightId]

  for (const fId of flightsToSeat) {
    const seatClasses = [
      ...['A', 'B', 'C', 'D'].flatMap(col =>
        [1, 2, 3].map(row => ({
          seatId: `seat-${fId}-${row}${col}`,
          flightId: fId,
          seatNumber: `${row}${col}`,
          seatClass: 'Business',
          isAvailable: true,
          isPremium: true,
        }))
      ),
      ...['A', 'B', 'C', 'D', 'E', 'F'].flatMap(col =>
        Array.from({ length: 12 }, (_, i) => i + 4).map(row => ({
          seatId: `seat-${fId}-${row}${col}`,
          flightId: fId,
          seatNumber: `${row}${col}`,
          seatClass: 'Economy',
          isAvailable: true,
          isPremium: false,
        }))
      )
    ]
    await prisma.seatMap.createMany({ data: seatClasses })
  }

  console.log('Seat maps seeded.')
  console.log('\nSeed process complete!')
  console.log('Test accounts:')
  console.log('  Fatma   → fatma.djerfi@email.com   / Password123!')
  console.log('           Booking FATMA1 on AH1042 ALG→CDG (CHECK_IN_OPEN, 18h away)')
  console.log('  Melliti → melliti.abdelmalek@email.com / Password123!')
  console.log('           Booking MELLITI1 on AH1042 ALG→CDG (CHECK_IN_OPEN, same flight)')
  console.log('  Youcef  → youcef.benali@email.com / Password123!')
  console.log('           YOUCEF1 on AH2056 ORN→LHR (CONFIRMED, 2 days away)')
  console.log('           YOUCEF2 on AH3099 ALG→IST (PASSED, 1.5 days ago)')
  console.log('           YOUCEF3 on AH4012 ALG→MRS (PASSED, 5 days ago)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
