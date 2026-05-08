// src/routes/auth.routes.ts
import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// ── Public Routes ──────────────────────────────────────────
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/refresh", AuthController.refresh);

// ── Protected Routes ───────────────────────────────────────
router.post("/logout", authMiddleware, AuthController.logout);

export default router;