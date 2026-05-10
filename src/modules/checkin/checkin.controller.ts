import { Request, Response } from "express";
import * as CheckInService from "./checkin.service.js";

import type {
  SaveBaggageRequest,
} from "../../types/checkin.types.js";

// ─── Save Baggage Declaration ──────────────────────────────
export const saveBaggageDeclaration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const passengerId = req.body.passengerId;
    const body: SaveBaggageRequest = req.body;

    const result = await CheckInService.saveBaggageDeclaration(
      passengerId,
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
    const passengerIdParam = req.params.passengerId;
    const passengerId = Array.isArray(passengerIdParam)
      ? passengerIdParam[0]
      : passengerIdParam;

    const result = await CheckInService.getBaggageDeclaration(passengerId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
