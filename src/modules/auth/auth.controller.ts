// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import * as AuthService from "./auth.service.js";
import type { LoginRequest, RegisterRequest } from "../../types/auth.types.js";

// ─── Login ─────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body: LoginRequest = req.body;  // { email, password }
    const result = await AuthService.loginUser(body);
    res.status(200).json(result);         // sends LoginResponse back to app
  } catch (error: any) {
    res.status(401).json({ message: error.message }); // wrong password etc
  }
};

// ─── Register ──────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const body: RegisterRequest = req.body; // { uid, email, password, ... }
    const result = await AuthService.registerUser(body);
    res.status(201).json(result);           // 201 = Created
  } catch (error: any) {
    res.status(400).json({ message: error.message }); // email exists etc
  }
};

// ─── Refresh Token ─────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;  // { refreshToken: "eyJ..." }
    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json(result);       // sends TokenResponse back to app
  } catch (error: any) {
    res.status(401).json({ message: error.message }); // expired/invalid
  }
};

// ─── Logout ────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    await AuthService.logoutUser();
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};