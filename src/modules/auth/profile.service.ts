import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import prisma from '../../prisma/client.js'

import type {
  ProfileResponse,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  UpdateEmailRequest,
} from '../../types/profile.types.js'

type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>

function toProfileResponse(
  user: UserWithProfile,
  message?: string
): ProfileResponse {
  const name = user.profile?.fullName ?? user.displayName ?? null
  const profileImageUrl = user.profile?.photoUrl ?? user.photoUrl ?? null

  return {
    success: true,
    message,
    data: {
      uid: user.uid,
      email: user.email,
      name,
      fullName: name,
      phoneNumber: user.profile?.phoneNumber ?? user.phoneNumber ?? null,
      profileImageUrl,
      avatarUrl: profileImageUrl,
      isVerified: false,
      isOnline: true,
    },
  }
}

// ─── Get Current Profile ───────────────────────────────────
export async function getCurrentProfile(uid: string): Promise<ProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: true,
    },
  })

  if (!user) throw new Error('User not found')

  return toProfileResponse(user)
}

// ─── Update Profile ────────────────────────────────────────
export async function updateProfile(
  uid: string,
  body: UpdateProfileRequest
): Promise<ProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { uid },
  })

  if (!user) throw new Error('User not found')

  const fullName = body.fullName ?? body.name
  const email = body.email?.trim()
  const hasFullName = fullName !== undefined
  const hasPhoneNumber = body.phoneNumber !== undefined
  const userData = {
    ...(email !== undefined ? { email } : {}),
    ...(hasFullName ? { displayName: fullName } : {}),
    ...(hasPhoneNumber ? { phoneNumber: body.phoneNumber } : {}),
  }
  const profileData = {
    ...(hasFullName ? { fullName } : {}),
    ...(hasPhoneNumber ? { phoneNumber: body.phoneNumber } : {}),
  }

  if (email !== undefined && email.length === 0) {
    throw new Error('Email is required')
  }

  if (email !== undefined && email !== user.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      throw new Error('Email already in use')
    }
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { uid },
        data: userData,
      })
    }

    const existingProfile = await tx.profile.findUnique({
      where: { uid },
    })

    if (existingProfile) {
      if (Object.keys(profileData).length > 0) {
        await tx.profile.update({
          where: { uid },
          data: profileData,
        })
      }
    } else {
      await tx.profile.create({
        data: {
          uid,
          fullName: fullName ?? user.displayName ?? 'User',
          phoneNumber: body.phoneNumber ?? user.phoneNumber ?? null,
        },
      })
    }
  })

  const updatedUser = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: true,
    },
  })

  if (!updatedUser) throw new Error('User not found')

  return toProfileResponse(updatedUser, 'Profile updated successfully')
}

// ─── Update Password ───────────────────────────────────────
export async function updatePassword(
  uid: string,
  body: UpdatePasswordRequest
): Promise<{ success: boolean; message: string }> {

  const user = await prisma.user.findUnique({
    where: { uid },
  })

  if (!user) throw new Error('User not found')

  const passwordMatch = await bcrypt.compare(
    body.currentPassword,
    user.passwordHash
  )

  if (!passwordMatch) {
    throw new Error('Current password is incorrect')
  }

  const newPasswordHash = await bcrypt.hash(body.newPassword, 12)

  await prisma.user.update({
    where: { uid },
    data: {
      passwordHash: newPasswordHash,
    },
  })

  return {
    success: true,
    message: 'Password updated successfully',
  }
}

// ─── Update Email ──────────────────────────────────────────
export async function updateEmail(
  uid: string,
  body: UpdateEmailRequest
): Promise<{ success: boolean; message: string }> {

  const user = await prisma.user.findUnique({
    where: { uid },
  })

  if (!user) throw new Error('User not found')

  const passwordMatch = await bcrypt.compare(
    body.password,
    user.passwordHash
  )

  if (!passwordMatch) {
    throw new Error('Invalid password')
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: body.newEmail },
  })

  if (existingEmail) {
    throw new Error('Email already in use')
  }

  await prisma.user.update({
    where: { uid },
    data: {
      email: body.newEmail,
    },
  })

  return {
    success: true,
    message: 'Email updated successfully',
  }
}

// ─── Upload Profile Photo ──────────────────────────────────
export async function uploadProfilePhoto(
  uid: string,
  photoUrl: string
): Promise<ProfileResponse> {
  if (!photoUrl) {
    throw new Error('Photo URL is required')
  }

  const user = await prisma.user.findUnique({
    where: { uid },
  })

  if (!user) throw new Error('User not found')

  const existingProfile = await prisma.profile.findUnique({
    where: { uid },
  })

  if (existingProfile) {
    await prisma.profile.update({
      where: { uid },
      data: {
        photoUrl,
      },
    })
  } else {
    await prisma.profile.create({
      data: {
        uid,
        fullName: user.displayName ?? 'User',
        photoUrl,
      },
    })
  }

  const updatedUser = await prisma.user.findUnique({
    where: { uid },
    include: {
      profile: true,
    },
  })

  if (!updatedUser) throw new Error('User not found')

  return toProfileResponse(updatedUser, 'Photo updated successfully')
}
