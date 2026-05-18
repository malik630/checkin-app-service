export interface ProfileDto {
  uid: string;

  email: string;

  name: string | null;
  fullName: string | null;
  phoneNumber: string | null;

  profileImageUrl: string | null;
  avatarUrl: string | null;

  isVerified: boolean;
  isOnline: boolean;
}

export interface GetProfileResponse {
  success: boolean;
  data: ProfileDto;
  message?: string | null;
}

export type ProfileResponse = GetProfileResponse;

// ─── Update Profile ────────────────────────────────────────
export interface UpdateProfileRequest {
  email?: string;
  fullName?: string;
  name?: string;
  phoneNumber?: string | null;
  phone_number?: string | null;
}

export interface UpdateProfileResponse {
  success: boolean;
  data: ProfileDto;
  message?: string | null;
}

// ─── Password Update ───────────────────────────────────────
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

// ─── Email Update ──────────────────────────────────────────
export interface UpdateEmailRequest {
  newEmail: string;
  password: string;
}

export interface UpdateEmailResponse {
  success: boolean;
  message: string;
}

// ─── Profile Photo ─────────────────────────────────────────
export interface UpdateProfilePhotoResponse {
  success: boolean;
  data: {
    profileImageUrl: string;
  };
  message?: string | null;
}
