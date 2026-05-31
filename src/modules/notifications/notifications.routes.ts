import { RequestHandler, Router } from 'express'
import * as notificationsController from './notifications.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'

const router = Router()

router.post(
  '/register-token',
  authMiddleware as RequestHandler,
  notificationsController.registerToken as unknown as RequestHandler
)
router.get(
  '/',
  authMiddleware as RequestHandler,
  notificationsController.getNotifications as unknown as RequestHandler
)
router.patch(
  '/:notificationId/read',
  authMiddleware as RequestHandler,
  notificationsController.markRead as unknown as RequestHandler
)
router.patch(
  '/read-all',
  authMiddleware as RequestHandler,
  notificationsController.markAllRead as unknown as RequestHandler
)

export default router
