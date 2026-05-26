import prisma from "../../prisma/client.js";

import type {
  SavePreferencesRequest,
  SavePreferencesResponse,
  ConcludeCheckinRequest,
  ConcludeCheckinResponse,
  PreferencesDto,
} from "../../types/preferences.types.js";

// ─── Save User Preferences ─────────────────────────────────
export async function savePreferences(
  body: SavePreferencesRequest
): Promise<SavePreferencesResponse> {
  const { uid } = body;

  if (!uid) throw new Error("User ID is required");

  // Validate user exists
  const user = await prisma.user.findUnique({ where: { uid } });
  if (!user) throw new Error("User not found");

  // Upsert preferences (create or update)
  const preferences = await prisma.preferences.upsert({
    where: { uid },
    update: {
      preferredSoutien: body.preferredSoutien,
      preferredVisualsAudit: body.preferredVisualsAudit,
      preferredChildCare: body.preferredChildCare,
      preferredPetCare: body.preferredPetCare,
      mealPreference: body.mealPreference,
    },
    create: {
      uid,
      preferredSoutien: body.preferredSoutien,
      preferredVisualsAudit: body.preferredVisualsAudit,
      preferredChildCare: body.preferredChildCare,
      preferredPetCare: body.preferredPetCare,
      mealPreference: body.mealPreference,
    },
  });

  return {
    success: true,
    message: "Preferences saved successfully",
    data: {
      preferenceId: preferences.preferenceId,
      uid: preferences.uid,
      preferredSoutien: preferences.preferredSoutien,
      preferredVisualsAudit: preferences.preferredVisualsAudit,
      preferredChildCare: preferences.preferredChildCare,
      preferredPetCare: preferences.preferredPetCare,
      mealPreference: preferences.mealPreference,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    },
  };
}

// ─── Get User Preferences ──────────────────────────────────
export async function getPreferences(uid: string): Promise<PreferencesDto | null> {
  if (!uid) throw new Error("User ID is required");

  const preferences = await prisma.preferences.findUnique({ where: { uid } });

  if (!preferences) {
    return null;
  }

  return {
    preferenceId: preferences.preferenceId,
    uid: preferences.uid,
    preferredSoutien: preferences.preferredSoutien,
    preferredVisualsAudit: preferences.preferredVisualsAudit,
    preferredChildCare: preferences.preferredChildCare,
    preferredPetCare: preferences.preferredPetCare,
    mealPreference: preferences.mealPreference,
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  };
}

// ─── Conclude Checkin with Preferences ─────────────────────
export async function concludeCheckinWithPreferences(
  body: ConcludeCheckinRequest
): Promise<ConcludeCheckinResponse> {
  const { passengerId, uid } = body;

  console.log("🔍 [Service] Starting concludeCheckinWithPreferences");
  console.log("🔍 [Service] passengerId:", passengerId);
  console.log("🔍 [Service] uid:", uid);
  console.log("🔍 [Service] Preferences:", {
    soutien: body.preferredSoutien,
    visuals: body.preferredVisualsAudit,
    childCare: body.preferredChildCare,
    petCare: body.preferredPetCare,
    meal: body.mealPreference,
  });

  if (!passengerId) throw new Error("Passenger ID is required");
  if (!uid) throw new Error("User ID is required");

  // Validate passenger exists
  const passenger = await prisma.passenger.findUnique({
    where: { passengerId },
    include: {
      booking: {
        select: {
          bookingId: true,
          uid: true,
          status: true,
        },
      },
    },
  });
  if (!passenger) throw new Error("Passenger not found");
  console.log("✅ [Service] Passenger found:", passenger.passengerId);

  if (passenger.booking.uid !== uid) {
    throw new Error("Passenger does not belong to this user");
  }

  // Validate check-in session exists
  const checkInSession = await prisma.checkInSession.findUnique({
    where: { passengerId },
  });
  if (!checkInSession) throw new Error("Check-in session not found");
  console.log("✅ [Service] Check-in session found:", checkInSession.sessionId);

  // Save preferences via shared helper
  console.log("⏳ [Service] Saving preferences...");
  const preferencesResult = await savePreferences({
    uid,
    preferredSoutien: body.preferredSoutien,
    preferredVisualsAudit: body.preferredVisualsAudit,
    preferredChildCare: body.preferredChildCare,
    preferredPetCare: body.preferredPetCare,
    mealPreference: body.mealPreference,
  });

  const preferences = preferencesResult.data;
  console.log("✅ [Service] Preferences saved");

  console.log("⏳ [Service] Closing check-in session and marking passenger as checked in...");
  const completedAt = new Date();
  const [updatedSession, updatedPassenger, updatedBooking] = await prisma.$transaction([
    prisma.checkInSession.update({
      where: { passengerId },
      data: {
        currentStep: "COMPLETED",
        completedAt,
      },
    }),
    prisma.passenger.update({
      where: { passengerId },
      data: {
        checkinStatus: "CHECKED_IN",
      },
    }),
    prisma.booking.update({
      where: { bookingId: passenger.booking.bookingId },
      data: {
        status: "CHECKED_IN",
      },
    }),
  ]);
  console.log(
    "✅ [Service] Check-in closed:",
    {
      sessionId: updatedSession.sessionId,
      passengerStatus: updatedPassenger.checkinStatus,
      bookingStatus: updatedBooking.status,
    }
  );

  return {
    success: true,
    message: "Check-in concluded and preferences saved successfully",
    data: {
      preferences: {
        preferenceId: preferences.preferenceId,
        uid: preferences.uid,
        preferredSoutien: preferences.preferredSoutien,
        preferredVisualsAudit: preferences.preferredVisualsAudit,
        preferredChildCare: preferences.preferredChildCare,
        preferredPetCare: preferences.preferredPetCare,
        mealPreference: preferences.mealPreference,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      },
      checkinSession: {
        sessionId: updatedSession.sessionId,
        passengerId: updatedSession.passengerId,
        currentStep: updatedSession.currentStep,
        completedAt: updatedSession.completedAt!,
      },
      passengerStatus: updatedPassenger.checkinStatus,
      bookingStatus: updatedBooking.status,
    },
  };
}
