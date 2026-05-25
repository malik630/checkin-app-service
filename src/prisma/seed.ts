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
    await prisma.user.deleteMany()
    console.log('Tables cleared successfully.')
  } catch (error) {
    console.log('Tables were already empty or do not exist yet. Proceeding to creation...');
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

  const youcef = await prisma.user.create({
    data: {
      uid: 'user-youcef-002',
      email: 'youcef.benali@email.com',
      passwordHash,
      displayName: 'Benali Youcef',
      phoneNumber: '+213 555 002 002',
      provider: 'email',
    },
  })

  console.log('Users seeded.')

  // Flights
  const now = new Date()


  const departure1 = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 3 * 60 * 1000)
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

  // 2. Upcoming Check-in Open flight (in 18 hours)
  const departure2 = new Date(now.getTime() + 18 * 60 * 60 * 1000)
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

  // 3. Checked In flight (in 2 days)
  const departure3 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
  const arrival3 = new Date(departure3.getTime() + 4 * 60 * 60 * 1000)
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

  // 4. Passed flight within 3 days (departed 1.5 days ago)
  const departure4 = new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000)
  const arrival4 = new Date(departure4.getTime() + 1.5 * 60 * 60 * 1000)
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

  // 5. Passed flight older than 3 days (departed 5 days ago)
  const departure5 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const arrival5 = new Date(departure5.getTime() + 2 * 60 * 60 * 1000)
  const flight5 = await prisma.flight.create({
    data: {
      flightId: 'flight-ah5088-005',
      flightNumber: 'AH 5088',
      origin: 'ALG',
      originCity: 'Algiers',
      destination: 'FCO',
      destinationCity: 'Rome',
      departureTime: departure5,
      arrivalTime: arrival5,
      aircraftType: 'Boeing 737-800',
      status: 'Scheduled',
      gate: 'D01',
      terminal: 'T2',
      boardingTime: '18:00',
      checkInOpensTime: '15:45',
    },
  })

  console.log('Flights seeded.')

  // Bookings (All for Fatma)
  const booking1 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-001',
      uid: fatma.uid,
      flightId: flight1.flightId,
      pnr: 'FATMA1',
      lastName: 'Djerfi',
      bookingRef: 'FATMA1',
      status: 'CONFIRMED',
      checkinDeadline: new Date(departure1.getTime() - 60 * 60 * 1000),
    },
  })

  const booking2 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-002',
      uid: fatma.uid,
      flightId: flight2.flightId,
      pnr: 'FATMA2',
      lastName: 'Djerfi',
      bookingRef: 'FATMA2',
      status: 'CHECK_IN_OPEN',
      checkinDeadline: new Date(departure2.getTime() - 60 * 60 * 1000),
    },
  })

  const booking3 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-003',
      uid: fatma.uid,
      flightId: flight3.flightId,
      pnr: 'FATMA3',
      lastName: 'Djerfi',
      bookingRef: 'FATMA3',
      status: 'CHECKED_IN',
      checkinDeadline: new Date(departure3.getTime() - 60 * 60 * 1000),
    },
  })

  const booking4 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-004',
      uid: fatma.uid,
      flightId: flight4.flightId,
      pnr: 'FATMA4',
      lastName: 'Djerfi',
      bookingRef: 'FATMA4',
      status: 'PASSED',
      checkinDeadline: new Date(departure4.getTime() - 60 * 60 * 1000),
    },
  })

  const booking5 = await prisma.booking.create({
    data: {
      bookingId: 'booking-fatma-005',
      uid: fatma.uid,
      flightId: flight5.flightId,
      pnr: 'FATMA5',
      lastName: 'Djerfi',
      bookingRef: 'FATMA5',
      status: 'PASSED',
      checkinDeadline: new Date(departure5.getTime() - 60 * 60 * 1000),
    },
  })

  /*const booking6 = await prisma.booking.create({
    data: {
      bookingId: 'booking-melliti-001',
      uid: melliti.uid,
      flightId: flight6.flightId,
      pnr: 'MELLITI1',
      lastName: 'MELLITI',
      bookingRef: 'MELLITI1',
      status: 'PASSED',
      checkinDeadline: new Date(departure5.getTime() - 60 * 60 * 1000),
    },
  })*/
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
      passengerId: 'passenger-fatma-002',
      bookingId: booking2.bookingId,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: '307840432',
      nationality: 'Algerian',
      dateOfBirth: '2004-05-30',
      expiryDate: '2027-07-24',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  const passenger3 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-fatma-003',
      bookingId: booking3.bookingId,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: '307840433',
      nationality: 'Algerian',
      dateOfBirth: '2004-05-30',
      expiryDate: '2027-07-24',
      seatNumber: '12A',
      checkinStatus: 'CHECKED_IN',
    },
  })

  const passenger4 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-fatma-004',
      bookingId: booking4.bookingId,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: '307840434',
      nationality: 'Algerian',
      dateOfBirth: '2004-05-30',
      expiryDate: '2027-07-24',
      seatNumber: '14C',
      checkinStatus: 'CHECKED_IN',
    },
  })

  const passenger5 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-fatma-005',
      bookingId: booking5.bookingId,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: '307840435',
      nationality: 'Algerian',
      dateOfBirth: '2004-05-30',
      expiryDate: '2027-07-24',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  const passenger6 = await prisma.passenger.create({
    data: {
      passengerId: 'passenger-melliti-001',
      bookingId: booking5.bookingId,
      firstName: 'Abdelmalek',
      lastName: 'MELLITI',
      passportNumber: '196118578',
      nationality: 'Algerian',
      dateOfBirth: '2004-12-25',
      expiryDate: '2024-01-22',
      seatNumber: null,
      checkinStatus: 'PENDING',
    },
  })

  console.log('Passengers seeded.')

  // CheckIn Sessions — FK is on Booking side, so:
  // 1. Create the session, 2. Update the booking to point to it
  const session3 = await prisma.checkInSession.create({
    data: {
      sessionId: 'session-fatma-003',
      passengerId: passenger3.passengerId,
      uid: fatma.uid,
      currentStep: 'COMPLETED',
      completedAt: now,
    },
  })
  await prisma.booking.update({
    where: { bookingId: booking3.bookingId },
    data: { checkinSessionId: session3.sessionId },
  })

  const session4 = await prisma.checkInSession.create({
    data: {
      sessionId: 'session-fatma-004',
      passengerId: passenger4.passengerId,
      uid: fatma.uid,
      currentStep: 'COMPLETED',
      completedAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.booking.update({
    where: { bookingId: booking4.bookingId },
    data: { checkinSessionId: session4.sessionId },
  })

  console.log('Check-in sessions seeded.')

  // Boarding Pass for Booking 3 (Checked In, future flight)
  await prisma.boardingPass.create({
    data: {
      passId: 'BP-passenger-fatma-003',
      passengerId: passenger3.passengerId,
      uid: fatma.uid,
      flightId: flight3.flightId,
      qrCode: 'CHECKIN_PASS:BP-passenger-fatma-003',
      seatNumber: '12A',
      gate: 'C03',
      boardingTime: '13:15',
      terminal: 'T3',
    },
  })

  console.log('Boarding passes seeded.')

  // Preferences
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

  // Seat map for flights
  console.log('Generating seat maps...')
  const flightsToSeat = [
    flight1.flightId,
    flight2.flightId,
    flight3.flightId,
    flight4.flightId,
    flight5.flightId,
  ]

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
          isAvailable: !(fId === flight3.flightId && row === 12 && col === 'A') && !(fId === flight4.flightId && row === 14 && col === 'C'),
          isPremium: false,
          occupiedBy: (fId === flight3.flightId && row === 12 && col === 'A') ? passenger3.passengerId : (fId === flight4.flightId && row === 14 && col === 'C') ? passenger4.passengerId : null
        }))
      )
    ]
    await prisma.seatMap.createMany({ data: seatClasses })
  }

  console.log('Seat maps seeded.')
  console.log('\nSeed process complete!')
  console.log('Fatma Test Bookings details:')
  console.log('  Email:        fatma.djerfi@email.com')
  console.log('  Password:     Password123!')
  console.log('  Booking 1:    Pnr = FATMA1 (Upcoming Confirmed)')
  console.log('  Booking 2:    Pnr = FATMA2 (Upcoming Check-in Open)')
  console.log('  Booking 3:    Pnr = FATMA3 (Upcoming Checked In)')
  console.log('  Booking 4:    Pnr = FATMA4 (Passed - Within 3 days)')
  console.log('  Booking 5:    Pnr = FATMA5 (Passed - Older than 3 days)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
