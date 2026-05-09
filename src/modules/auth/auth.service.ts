import bcrypt from 'bcryptjs'
import prisma from '../../prisma/client.js'
import { signToken } from '../../utils/jwt.js'
import { env } from '../../config/env.js'
import jwt from 'jsonwebtoken'
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  AuthResponse,
  TokenResponse,
} from '../../types/auth.types.js'

// ─── Token Helpers ─────────────────────────────────────────

function generateRefreshToken(uid: string): string {
  return jwt.sign({ uid }, env.jwt.refreshSecret, { expiresIn: '7d' } as jwt.SignOptions)
}

// ─── Login ─────────────────────────────────────────────────
export async function loginUser(body: LoginRequest): Promise<LoginResponse> {
  const record = await prisma.user.findUnique({ where: { email: body.email } })
  if (!record) throw new Error('User not found')

  const passwordMatch = await bcrypt.compare(body.password, record.passwordHash)
  if (!passwordMatch) throw new Error('Invalid credentials')

  await prisma.user.update({
    where: { email: body.email },
    data: { lastLogin: new Date() },
  })

  const token = signToken({ uid: record.uid, email: record.email })
  const refreshToken = generateRefreshToken(record.uid)

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
    refreshToken,
  }
}

// ─── Register ──────────────────────────────────────────────
export async function registerUser(body: RegisterRequest): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) throw new Error('Email already in use')

  const passwordHash = await bcrypt.hash(body.password, 12)

  const newUser = await prisma.user.create({
    data: {
      uid: body.uid,
      email: body.email,
      passwordHash,
      displayName: body.display_name ?? 'User',
      phoneNumber: body.phone_number ?? null,
      provider: 'email',
    },
  })

  const token = signToken({ uid: newUser.uid, email: newUser.email })
  const refreshToken = generateRefreshToken(newUser.uid)

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
    refreshToken,
  }
}

// ─── Refresh Token ─────────────────────────────────────────
export async function refreshToken(token: string): Promise<TokenResponse> {
  const decoded = jwt.verify(token, env.jwt.refreshSecret) as { uid: string }

  const user = await prisma.user.findUnique({ where: { uid: decoded.uid } })
  if (!user) throw new Error('User not found')

  const newAccessToken = signToken({ uid: user.uid, email: user.email })
  const newRefreshToken = generateRefreshToken(user.uid)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}

// ─── Logout ────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  return
}