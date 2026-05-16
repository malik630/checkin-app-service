export interface UserPreferences {
  userId: string
  preferredSoutien: boolean
  preferredVisualsAudit: boolean
  preferredChildCare: boolean
  preferredPetCare: boolean
  mealPreference: boolean
}

export interface UpdatePreferencesRequest {
  preferredSoutien?: boolean
  preferredVisualsAudit?: boolean
  preferredChildCare?: boolean
  preferredPetCare?: boolean
  mealPreference?: boolean
}

// ─── Save Preferences Request ──────────────────────────────
export interface SavePreferencesRequest {
  uid: string
  preferredSoutien: boolean
  preferredVisualsAudit: boolean
  preferredChildCare: boolean
  preferredPetCare: boolean
  mealPreference: boolean
}

// ─── Preferences DTO ───────────────────────────────────────
export interface PreferencesDto {
  preferenceId: string
  uid: string
  preferredSoutien: boolean
  preferredVisualsAudit: boolean
  preferredChildCare: boolean
  preferredPetCare: boolean
  mealPreference: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Save Preferences Response ─────────────────────────────
export interface SavePreferencesResponse {
  success: boolean
  message: string
  data: PreferencesDto
}

// ─── Conclude Checkin with Preferences Request ─────────────
export interface ConcludeCheckinRequest {
  passengerId: string
  uid: string
  preferredSoutien: boolean
  preferredVisualsAudit: boolean
  preferredChildCare: boolean
  preferredPetCare: boolean
  mealPreference: boolean
}

// ─── Conclude Checkin Response ────────────────────────────
export interface ConcludeCheckinResponse {
  success: boolean
  message: string
  data: {
    preferences: PreferencesDto
    checkinSession: {
      sessionId: string
      passengerId: string
      currentStep: string
      completedAt: Date
    }
  }
}
