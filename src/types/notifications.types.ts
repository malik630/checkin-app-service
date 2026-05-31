export type NotificationType = 'WELCOME' | 'CHECK_IN' | 'BOARDING' | string

export interface RegisterTokenRequest {
  token: string
}

export interface NotificationData {
  type: NotificationType
  screen: string
  bookingId?: string
  boardingPassId?: string
}

export interface SendNotificationInput {
  uid: string
  title: string
  body: string
  type: NotificationType
  screen: string
  bookingId?: string
  boardingPassId?: string
  passengerId?: string
  flightId?: string
}

export interface NotificationDto {
  notificationId: string
  type: string
  title: string
  body: string
  screen: string
  bookingId: string | null
  boardingPassId: string | null
  passengerId: string | null
  flightId: string | null
  isRead: boolean
  createdAt: string
}
