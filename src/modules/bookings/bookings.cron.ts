import prisma from '../../prisma/client.js'

export function startBookingStatusCron() {
  console.log('Booking status synchronizer cron job started (runs every 2 minutes)...')
  
  setInterval(async () => {
    try {
      const now = new Date()
      const checkInThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      // 1. CONFIRMED -> CHECK_IN_OPEN (flight departure <= 24 hours away)
      const toOpen = await prisma.booking.updateMany({
        where: {
          status: 'CONFIRMED',
          flight: {
            departureTime: { lte: checkInThreshold }
          }
        },
        data: {
          status: 'CHECK_IN_OPEN'
        }
      })
      if (toOpen.count > 0) {
        console.log(`[Cron] Updated ${toOpen.count} bookings from CONFIRMED to CHECK_IN_OPEN.`)
      }

      // 2. CHECK_IN_OPEN -> PASSED (checkinDeadline has passed)
      const toPassedFromOpen = await prisma.booking.updateMany({
        where: {
          status: 'CHECK_IN_OPEN',
          checkinDeadline: { lte: now }
        },
        data: {
          status: 'PASSED'
        }
      })
      if (toPassedFromOpen.count > 0) {
        console.log(`[Cron] Updated ${toPassedFromOpen.count} bookings from CHECK_IN_OPEN to PASSED (check-in deadline reached).`)
      }

      // 3. Any other non-PASSED and non-CHECKED_IN status -> PASSED (flight departed)
      const toPassedGeneral = await prisma.booking.updateMany({
        where: {
          status: { notIn: ['PASSED', 'CHECKED_IN'] },
          flight: {
            departureTime: { lt: now }
          }
        },
        data: {
          status: 'PASSED'
        }
      })
      if (toPassedGeneral.count > 0) {
        console.log(`[Cron] Updated ${toPassedGeneral.count} bookings to PASSED (flight departed).`)
      }

    } catch (error) {
      console.error('[Cron] Error running booking status synchronizer:', error)
    }
  }, 120000) // 2 minutes
}
