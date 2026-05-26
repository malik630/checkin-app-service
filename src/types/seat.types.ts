export interface SeatMapDto {
  seatId: string
  flightId: string
  seatNumber: string
  seatClass: string
  isAvailable: boolean
  isPremium: boolean
  occupiedBy?: string | null
}

export interface SelectSeatRequest {
  seatNumber: string
  uid?: string
  userId?: string
  checkinSessionId?: string
}

export interface SelectedSeatDto extends SeatMapDto {
  passengerId: string
  bookingId: string
  userId: string
  uid: string
  checkinSessionId: string
  currentStep: string
}
