import { RequestHandler, Router } from "express";
import * as CheckInController from "./checkin.controller.js";

const router = Router();

// ── Protected Routes ───────────────────────────────────────
router.post("/baggage", CheckInController.saveBaggageDeclaration);
router.get("/baggage/:passengerId", CheckInController.getBaggageDeclaration);

export default router;