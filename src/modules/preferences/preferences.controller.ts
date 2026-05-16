import { Request, Response } from "express";
import * as PreferencesService from "./preferences.service.js";

import type {
  SavePreferencesRequest,
  ConcludeCheckinRequest,
} from "../../types/preferences.types.js";

// ─── Save User Preferences ────────────────────────────────
export const saveUserPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: SavePreferencesRequest = req.body;

    if (!body.uid) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const result = await PreferencesService.savePreferences(body);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Get User Preferences ─────────────────────────────────
export const getUserPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uidParam = req.params.uid;
    const uid = Array.isArray(uidParam) ? uidParam[0] : uidParam;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const preferences = await PreferencesService.getPreferences(uid);

    if (!preferences) {
      res.status(404).json({
        success: false,
        message: "Preferences not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Conclude Checkin with Preferences ────────────────────
export const concludeCheckinWithPreferences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body: ConcludeCheckinRequest = req.body;

    // Debug: Log all incoming request data
    console.log("=== CONCLUDE CHECKIN REQUEST DEBUG ===");
    console.log("Full request body:", JSON.stringify(body, null, 2));
    console.log("passengerId:", body.passengerId, "- Type:", typeof body.passengerId);
    console.log("uid:", body.uid, "- Type:", typeof body.uid);
    console.log("preferredSoutien:", body.preferredSoutien, "- Type:", typeof body.preferredSoutien);
    console.log("preferredVisualsAudit:", body.preferredVisualsAudit, "- Type:", typeof body.preferredVisualsAudit);
    console.log("preferredChildCare:", body.preferredChildCare, "- Type:", typeof body.preferredChildCare);
    console.log("preferredPetCare:", body.preferredPetCare, "- Type:", typeof body.preferredPetCare);
    console.log("mealPreference:", body.mealPreference, "- Type:", typeof body.mealPreference);
    console.log("======================================");

    if (!body.passengerId) {
      console.error("❌ Missing passengerId");
      res.status(400).json({
        success: false,
        message: "Passenger ID is required",
      });
      return;
    }

    if (!body.uid) {
      console.error("❌ Missing uid");
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    const result = await PreferencesService.concludeCheckinWithPreferences(body);

    console.log("✅ Checkin concluded successfully");
    res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Error concluding checkin:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
