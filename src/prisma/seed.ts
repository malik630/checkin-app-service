import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const passwordHash = await bcrypt.hash('Password123', 12)

  const fatma = await prisma.user.upsert({
    where: { email: 'fatma.djerfi@email.com' },
    update: {},
    create: {
      uid: 'user-fatma-001',
      email: 'fatma.djerfi@email.com',
      passwordHash,
      displayName: 'Djerfi Fatma',
      phoneNumber: '+213 555 001 001',
      provider: 'email',
    },
  })

  const youcef = await prisma.user.upsert({
    where: { email: 'youcef.benali@email.com' },
    update: {},
    create: {
      uid: 'user-youcef-002',
      email: 'youcef.benali@email.com',
      passwordHash,
      displayName: 'Benali Youcef',
      phoneNumber: '+213 555 002 002',
      provider: 'email',
    },
  })

  console.log('Users seeded')

  // Flights
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const flight1 = await prisma.flight.upsert({
    where: { flightNumber: 'AH 1042' },
    update: {},
    create: {
      flightId: 'flight-ah1042-001',
      flightNumber: 'AH 1042',
      origin: 'ALG',
      originCity: 'Algiers',
      destination: 'CDG',
      destinationCity: 'Paris',
      departureTime: new Date(tomorrow.setHours(8, 35, 0, 0)),
      arrivalTime: new Date(tomorrow.setHours(11, 50, 0, 0)),
      aircraftType: 'Boeing 737-800',
      status: 'Scheduled',
      gate: 'A12',
      terminal: 'T1',
      boardingTime: '07:50',
      checkInOpensTime: '05:35',
    },
  })

  const flight2 = await prisma.flight.upsert({
    where: { flightNumber: 'AH 2056' },
    update: {},
    create: {
      flightId: 'flight-ah2056-002',
      flightNumber: 'AH 2056',
      origin: 'ORN',
      originCity: 'Oran',
      destination: 'LHR',
      destinationCity: 'London',
      departureTime: new Date(nextWeek.setHours(10, 15, 0, 0)),
      arrivalTime: new Date(nextWeek.setHours(14, 30, 0, 0)),
      aircraftType: 'Airbus A330-200',
      status: 'Scheduled',
      gate: 'B05',
      terminal: 'T2',
      boardingTime: '09:30',
      checkInOpensTime: '07:15',
    },
  })

  console.log('Flights seeded')

  // Bookings
  const booking1 = await prisma.booking.upsert({
    where: { bookingRef: 'BB9XC2' },
    update: {},
    create: {
      bookingId: 'booking-001',
      uid: fatma.uid,
      flightId: flight1.flightId,
      pnr: 'BB9XC2',
      lastName: 'Djerfi',
      bookingRef: 'BB9XC2',
      status: 'CHECK_IN_OPEN',
      checkinDeadline: new Date(new Date(flight1.departureTime).getTime() - 60 * 60 * 1000),
    },
  })

  const booking2 = await prisma.booking.upsert({
    where: { bookingRef: 'XY5F3K' },
    update: {},
    create: {
      bookingId: 'booking-002',
      uid: youcef.uid,
      flightId: flight2.flightId,
      pnr: 'XY5F3K',
      lastName: 'Benali',
      bookingRef: 'XY5F3K',
      status: 'CONFIRMED',
      checkinDeadline: new Date(new Date(flight2.departureTime).getTime() - 60 * 60 * 1000),
    },
  })

  console.log('Bookings seeded')

  // Passengers
  const passenger1 = await prisma.passenger.upsert({
    where: { passengerId: 'passenger-fatma-001' },
    update: {},
    create: {
      passengerId: 'passenger-fatma-001',
      bookingId: booking1.bookingId,
      uid: fatma.uid,
      firstName: 'Fatma',
      lastName: 'Djerfi',
      passportNumber: 'AB123456',
      nationality: 'Algerian',
      dateOfBirth: '1990-05-15',
      expiryDate: '2028-05-14',
      seatNumber: '12A',
      checkinStatus: 'PENDING',
    },
  })

  const passenger2 = await prisma.passenger.upsert({
    where: { passengerId: 'passenger-youcef-002' },
    update: {},
    create: {
      passengerId: 'passenger-youcef-002',
      bookingId: booking2.bookingId,
      uid: youcef.uid,
      firstName: 'Youcef',
      lastName: 'Benali',
      passportNumber: 'CD789012',
      nationality: 'Algerian',
      dateOfBirth: '1988-11-23',
      expiryDate: '2027-11-22',
      seatNumber: '7C',
      checkinStatus: 'PENDING',
    },
  })

  console.log('Passengers seeded')

  // Seat map for flight 1
  const seatClasses = [
    // Business (rows 1-3)
    ...['A', 'B', 'C', 'D'].flatMap(col =>
      [1, 2, 3].map(row => ({
        flightId: flight1.flightId,
        seatNumber: `${row}${col}`,
        seatClass: 'Business',
        isAvailable: true,
        isPremium: true,
      }))
    ),
    // Economy (rows 4-30)
    ...['A', 'B', 'C', 'D', 'E', 'F'].flatMap(col =>
      Array.from({ length: 27 }, (_, i) => i + 4).map(row => ({
        flightId: flight1.flightId,
        seatNumber: `${row}${col}`,
        seatClass: 'Economy',
        isAvailable: row !== 12 || (col !== 'A' && col !== 'B'), // 12A, 12B occupied
        isPremium: row <= 7,
      }))
    ),
  ]

  for (const seat of seatClasses.slice(0, 40)) {
    await prisma.seatMap.upsert({
      where: { flightId_seatNumber: { flightId: seat.flightId, seatNumber: seat.seatNumber } },
      update: {},
      create: seat,
    })
  }

  // Mark seat 12A as occupied by passenger1
  await prisma.seatMap.updateMany({
    where: { flightId: flight1.flightId, seatNumber: '12A' },
    data: { isAvailable: false, occupiedBy: passenger1.passengerId },
  })

  console.log('Seat map seeded')

  // Notifications
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        notificationId: 'notif-001',
        uid: fatma.uid,
        passengerId: passenger1.passengerId,
        flightId: flight1.flightId,
        type: 'CHECK_IN_CONFIRMATION',
        title: 'Check-in Available',
        body: `Online check-in is now open for your flight AH 1042 to Paris. Check in before 07:35.`,
        isRead: false,
      },
      {
        notificationId: 'notif-002',
        uid: fatma.uid,
        flightId: flight1.flightId,
        type: 'BOARDING_REMINDER',
        title: 'Boarding in 1 Hour',
        body: 'Your flight AH 1042 boards at Gate A12 in approximately 1 hour.',
        isRead: true,
      },
      {
        notificationId: 'notif-003',
        uid: youcef.uid,
        passengerId: passenger2.passengerId,
        flightId: flight2.flightId,
        type: 'FLIGHT_STATUS_UPDATE',
        title: 'Flight Confirmed',
        body: 'Your flight AH 2056 to London is confirmed and on schedule.',
        isRead: false,
      },
    ],
  })

  console.log('Notifications seeded')

  // Preferences
  await prisma.preferences.createMany({
    skipDuplicates: true,
    data: [
      {
        uid: fatma.uid,
        preferredSoutien: true,
        preferredVisualsAudit: false,
        preferredChildCare: false,
        preferredPetCare: false,
        mealPreference: true,
      },
      {
        uid: youcef.uid,
        preferredSoutien: false,
        preferredVisualsAudit: true,
        preferredChildCare: false,
        preferredPetCare: true,
        mealPreference: false,
      },
    ],
  })

  console.log('Preferences seeded')
  console.log('\nSeed complete!')
  console.log('Test credentials:')
  console.log('  Email:    fatma.djerfi@email.com')
  console.log('  Password: Password123!')
  console.log('  PNR:      BB9XC2  |  Last name: Djerfi')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
