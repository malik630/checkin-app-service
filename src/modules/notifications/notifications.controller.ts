import type { Response } from 'express'
import * as NotificationsService from './notifications.service.js'
import * as R from '../../utils/response.js'
import type { AuthenticatedRequest } from '../../types/index.js'
import type { RegisterTokenRequest } from '../../types/notifications.types.js'

export const registerToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body as RegisterTokenRequest
    if (!token || typeof token !== 'string') {
      R.badRequest(res, 'token is required')
      return
    }

    const result = await NotificationsService.registerToken(req.user.uid, token)
    R.created(res, result.data, result.message)
  } catch (error: any) {
    R.badRequest(res, error.message)
  }
}

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await NotificationsService.getNotifications(req.user.uid)
    R.ok(res, notifications, 'Notifications retrieved')
  } catch (error: any) {
    R.serverError(res, error.message)
  }
}

export const markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params
    if (!notificationId || Array.isArray(notificationId)) {
      R.badRequest(res, 'notificationId is required')
      return
    }

    const notification = await NotificationsService.markNotificationRead(req.user.uid, notificationId)
    R.ok(res, notification, 'Notification marked as read')
  } catch (error: any) {
    if (error.message.includes('not found')) R.notFound(res, error.message)
    else R.serverError(res, error.message)
  }
}

export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await NotificationsService.markAllNotificationsRead(req.user.uid)
    R.ok(res, result, 'Notifications marked as read')
  } catch (error: any) {
    R.serverError(res, error.message)
  }
}
