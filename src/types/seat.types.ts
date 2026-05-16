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
}
