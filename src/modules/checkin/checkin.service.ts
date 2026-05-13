import prisma from "../../prisma/client.js";

import type {
  SaveBaggageRequest,
  GetBaggageResponse,
  SaveBaggageResponse,
} from "../../types/checkin.types.js";

// Save Baggage Declaration
export async function saveBaggageDeclaration(
  uid: string,
  body: SaveBaggageRequest
): Promise<SaveBaggageResponse> {
  if (!uid) throw new Error("User ID is required");
  if (!body) throw new Error("Baggage declaration is required");

  const checkedBaggageCount = validateBaggageCount(
    body.checkedBaggageCount,
    "checkedBaggageCount"
  );
  const specialEquipmentCount = validateBaggageCount(
    body.specialEquipmentCount,
    "specialEquipmentCount"
  );
  const baggageDeclaration = {
    checkedBaggageCount,
    specialEquipmentCount,
  };

  const session = await prisma.checkInSession.findFirst({
    where: {
      passenger: { uid },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!session) throw new Error("Check-in session not found");

  const updatedSession = await prisma.checkInSession.update({
    where: { passengerId: session.passengerId },
    data: {
      checkedBaggageCount,
      specialEquipmentCount,
      baggageDeclaration,
      currentStep: "BAGGAGE_DECLARATION",
    },
  });

  return {
    success: true,
    message: "Baggage declaration saved",
    data: {
      sessionId: updatedSession.sessionId,
      passengerId: updatedSession.passengerId,
      baggageDeclaration,
      currentStep: updatedSession.currentStep,
    },
  };
}

// Get Baggage Declaration
export async function getBaggageDeclaration(
  uid: string
): Promise<GetBaggageResponse> {
  if (!uid) throw new Error("User ID is required");

  const session = await prisma.checkInSession.findFirst({
    where: {
      passenger: { uid },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!session) {
    return {
      success: true,
      data: {
        checkedBaggageCount: 0,
        specialEquipmentCount: 0,
      },
    };
  }

  return {
    success: true,
    data: {
      checkedBaggageCount: session.checkedBaggageCount,
      specialEquipmentCount: session.specialEquipmentCount,
    },
  };
}

function validateBaggageCount(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }

  return value;
}
