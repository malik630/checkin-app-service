import cron from 'node-cron'
import prisma from '../../prisma/client.js'
import { sendNotification } from './notifications.service.js'

export function startCheckInNotificationCron(): void {
  console.log('Check-in notification cron job started (runs every 5 minutes)...')

  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

      const bookings = await prisma.booking.findMany({
        where: {
          checkinDeadline: {
            gt: now,
            lte: oneHourLater,
          },
          passengers: {
            some: {
              checkinStatus: { not: 'CHECKED_IN' },
            },
          },
          notifications: {
            none: {
              type: 'CHECK_IN',
            },
          },
        },
        include: {
          passengers: {
            select: { passengerId: true },
            take: 1,
          },
        },
      })

      for (const booking of bookings) {
        await sendNotification({
          uid: booking.uid,
          flightId: booking.flightId,
          passengerId: booking.passengers[0]?.passengerId,
          bookingId: booking.bookingId,
          title: 'Check-in closes in 1 hour',
          body: 'Complete your check-in now',
          type: 'CHECK_IN',
          screen: 'checkin',
        })
      }
    } catch (error) {
      console.error('[Notifications Cron] Failed to send check-in notifications:', error)
    }
  })
}
