// ─── Baggage DTO ───────────────────────────────────────────
export interface BaggageDto {
  checkedBaggageCount: number;
  specialEquipmentCount: number;
}

// ─── Save Baggage Request ──────────────────────────────────
export interface SaveBaggageRequest {
  passengerId: string;
  checkedBaggageCount: number;
  specialEquipmentCount: number;
}

// ─── Save Baggage Response ─────────────────────────────────
export interface SaveBaggageResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    passengerId: string;
    baggageDeclaration: BaggageDto;
    currentStep: string;
  };
}

// ─── Get Baggage Response ──────────────────────────────────
export interface GetBaggageResponse {
  success: boolean;
  data: BaggageDto;
}