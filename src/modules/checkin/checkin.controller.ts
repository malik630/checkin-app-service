import { Request, Response } from "express";
import * as CheckInService from "./checkin.service.js";

import type {
  SaveBaggageRequest,
} from "../../types/checkin.types.js";
import type { AuthenticatedRequest } from "../../types/index.js";

// ─── Save Baggage Declaration ──────────────────────────────
export const saveBaggageDeclaration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as AuthenticatedRequest).user.uid;
    const body: SaveBaggageRequest = req.body;

    const result = await CheckInService.saveBaggageDeclaration(
      uid,
      body
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Get Baggage Declaration ───────────────────────────────
export const getBaggageDeclaration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as AuthenticatedRequest).user.uid;

    const result = await CheckInService.getBaggageDeclaration(uid);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
