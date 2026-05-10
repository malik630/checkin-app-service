import { RequestHandler, Router } from "express";
import * as AuthController from "./auth.controller.js";
import * as ProfileController from "./profile.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// ── Public Routes ──────────────────────────────────────────
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/refresh", AuthController.refresh);

// ── Protected Routes ───────────────────────────────────────
router.post("/logout", authMiddleware as RequestHandler, AuthController.logout);
router.get("/profile", authMiddleware as RequestHandler, ProfileController.getCurrentProfile);
router.put("/profile", authMiddleware as RequestHandler, ProfileController.updateProfile);
router.put("/profile/password", authMiddleware as RequestHandler, ProfileController.updatePassword);
router.post("/profile/photo", authMiddleware as RequestHandler, ProfileController.uploadProfilePhoto);
router.put("/profile/email", authMiddleware as RequestHandler, ProfileController.updateEmail);

export default router;