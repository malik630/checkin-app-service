import { RequestHandler, Router } from "express";
import * as CheckInController from "./checkin.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// ── Protected Routes ───────────────────────────────────────
router.post("/baggage", authMiddleware as RequestHandler, CheckInController.saveBaggageDeclaration);
router.get("/baggage/:passengerId", authMiddleware as RequestHandler, CheckInController.getBaggageDeclaration);

export default router;