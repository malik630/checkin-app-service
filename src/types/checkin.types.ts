// Baggage DTO
export interface BaggageDto {
  checkedBaggageCount: number;
  specialEquipmentCount: number;
}

export interface SaveBaggageRequest {
  passengerId: string;
  checkedBaggageCount: number;
  specialEquipmentCount: number;
}

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

export interface GetBaggageResponse {
  success: boolean;
  data: BaggageDto;
}

// Session
export interface SessionDto {
  sessionId: string;
  passengerId: string;
  bookingId: string;
  currentStep: string;
}

export interface CreateSessionRequest {
  passengerId: string;
  bookingId: string;
}

export interface CreateSessionResponse {
  success: boolean;
  message: string;
  data: SessionDto;
}

export interface UpdateStepRequest {
  passengerId: string;
  step: string;
}

export interface UpdateStepResponse {
  success: boolean;
  data: {
    sessionId: string;
    currentStep: string;
  };
}