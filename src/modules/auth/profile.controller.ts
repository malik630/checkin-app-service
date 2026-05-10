import { Request, Response } from "express";
import * as ProfileService from "./profile.service.js";

import type {
  UpdateProfileRequest,
  UpdatePasswordRequest,
  UpdateEmailRequest,
} from "../../types/profile.types.js";

// ─── Get Current Profile ───────────────────────────────────
export const getCurrentProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as any).user.uid;

    const result = await ProfileService.getCurrentProfile(uid);

    res.status(200).json(result);

  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Update Profile ────────────────────────────────────────
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as any).user.uid;

    const body: UpdateProfileRequest = req.body;

    const result = await ProfileService.updateProfile(uid, body);

    res.status(200).json(result);

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Update Password ───────────────────────────────────────
export const updatePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as any).user.uid;

    const body: UpdatePasswordRequest = req.body;

    const result = await ProfileService.updatePassword(uid, body);

    res.status(200).json(result);

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Update Email ──────────────────────────────────────────
export const updateEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as any).user.uid;

    const body: UpdateEmailRequest = req.body;

    const result = await ProfileService.updateEmail(uid, body);

    res.status(200).json(result);

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Upload Profile Photo ──────────────────────────────────
export const uploadProfilePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const uid = (req as any).user.uid;

    const photoUrl = req.body.photoUrl;

    const result = await ProfileService.uploadProfilePhoto(
      uid,
      photoUrl
    );

    res.status(200).json(result);

  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
