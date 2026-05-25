import type { Notification } from '@prisma/client'
import admin from '../../config/firebase.js'
import prisma from '../../prisma/client.js'
import type {
  NotificationDto,
  SendNotificationInput,
} from '../../types/notifications.types.js'

function toDto(notification: Notification): NotificationDto {
  return {
    notificationId: notification.notificationId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    screen: notification.screen,
    bookingId: notification.bookingId,
    boardingPassId: notification.boardingPassId,
    passengerId: notification.passengerId,
    flightId: notification.flightId,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  }
}

function cleanData(data: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  )
}

export async function registerToken(uid: string, token: string) {
  const trimmedToken = token.trim()
  if (!trimmedToken) throw new Error('Token is required')

  const deviceToken = await prisma.deviceToken.upsert({
    where: { fcmToken: trimmedToken },
    create: {
      uid,
      fcmToken: trimmedToken,
    },
    update: {
      uid,
    },
  })

  return {
    success: true,
    message: 'Device token registered',
    data: deviceToken,
  }
}

export async function sendNotification(input: SendNotificationInput): Promise<NotificationDto> {
  const notification = await prisma.notification.create({
    data: {
      uid: input.uid,
      title: input.title,
      body: input.body,
      type: input.type,
      screen: input.screen,
      bookingId: input.bookingId,
      boardingPassId: input.boardingPassId,
      passengerId: input.passengerId,
      flightId: input.flightId,
    },
  })

  const tokens = await prisma.deviceToken.findMany({
    where: { uid: input.uid },
    select: { fcmToken: true },
  })

  if (tokens.length > 0) {
    const data = cleanData({
      type: input.type,
      screen: input.screen,
      bookingId: input.bookingId,
      boardingPassId: input.boardingPassId,
    })

    const results = await Promise.allSettled(
      tokens.map(({ fcmToken }) =>
        admin.messaging().send({
          token: fcmToken,
          notification: {
            title: input.title,
            body: input.body,
          },
          data,
        })
      )
    )

    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('[Notifications] FCM send failed:', result.reason)
      }
    })
  }

  return toDto(notification)
}

export async function getNotifications(uid: string): Promise<NotificationDto[]> {
  const notifications = await prisma.notification.findMany({
    where: { uid },
    orderBy: { createdAt: 'desc' },
  })

  return notifications.map(toDto)
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<NotificationDto> {
  const notification = await prisma.notification.findFirst({
    where: { uid, notificationId },
  })

  if (!notification) throw new Error('Notification not found')

  const updated = await prisma.notification.update({
    where: { notificationId },
    data: { isRead: true },
  })

  return toDto(updated)
}

export async function markAllNotificationsRead(uid: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { uid, isRead: false },
    data: { isRead: true },
  })

  return { count: result.count }
}
