import { RequestHandler, Router } from "express";
import * as PreferencesController from "./preferences.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// ── Protected Routes ───────────────────────────────────────

// Save user preferences
router.post(
  "/",
  authMiddleware as RequestHandler,
  PreferencesController.saveUserPreferences
);

// Get user preferences
router.get(
  "/:uid",
  authMiddleware as RequestHandler,
  PreferencesController.getUserPreferences
);

// Conclude check-in with preferences (final step)
router.post(
  "/conclude",
  authMiddleware as RequestHandler,
  PreferencesController.concludeCheckinWithPreferences
);

export default router;
