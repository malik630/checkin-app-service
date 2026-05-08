// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.js";
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  AuthResponse,
  TokenResponse,
} from "../../types/auth.types.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// ─── Token Helpers ─────────────────────────────────────────
function generateAccessToken(uid: string, email: string): string {
  return jwt.sign({ uid, email }, JWT_SECRET, { expiresIn: "1h" });
}

function generateRefreshToken(uid: string): string {
  return jwt.sign({ uid }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

// ─── Login ─────────────────────────────────────────────────
export async function loginUser(body: LoginRequest): Promise<LoginResponse> {
  const record = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (!record) throw new Error("User not found");

  const passwordMatch = await bcrypt.compare(body.password, record.passwordHash);
  if (!passwordMatch) throw new Error("Invalid credentials");

  await prisma.user.update({
    where: { email: body.email },
    data: { lastLogin: new Date() },
  });

  const token = generateAccessToken(record.uid, record.email);

  return {
    user: {
      uid: record.uid,
      email: record.email,
      displayName: record.displayName,
      phoneNumber: record.phoneNumber ?? null,
      photoUrl: record.photoUrl ?? null,
      provider: record.provider,
      createdAt: record.createdAt,
      lastLogin: record.lastLogin,
      token,
    },
    token,
  };
}

// ─── Register ──────────────────────────────────────────────
export async function registerUser(body: RegisterRequest): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(body.password, 12);

  const newUser = await prisma.user.create({
    data: {
      uid: body.uid,
      email: body.email,
      passwordHash,
      displayName: body.display_name ?? "User",
      phoneNumber: body.phone_number ?? null,
      provider: "email",
    },
  });

  const token = generateAccessToken(newUser.uid, newUser.email);

  return {
    user: {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.displayName,
      phoneNumber: newUser.phoneNumber ?? null,
      photoUrl: newUser.photoUrl ?? null,
      provider: newUser.provider,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin,
      token,
    },
    token,
  };
}

// ─── Refresh Token ─────────────────────────────────────────
export async function refreshToken(token: string): Promise<TokenResponse> {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { uid: string };

  const user = await prisma.user.findUnique({
    where: { uid: decoded.uid },
  });
  if (!user) throw new Error("User not found");

  const newAccessToken = generateAccessToken(user.uid, user.email);
  const newRefreshToken = generateRefreshToken(user.uid);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─── Logout ────────────────────────────────────────────────
// JWT is stateless — client discards the token on logout
export async function logoutUser(): Promise<void> {
  return;
}