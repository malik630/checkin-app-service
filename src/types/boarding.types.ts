export interface GenerateBoardingPassRequest {
  passengerId: string
}

export interface BoardingPassDto {
  passId: string
  passengerId: string
  flightId: string
  flightNumber: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  passengerName: string
  seatNumber: string
  gate: string
  boardingTime: string
  terminal: string | null
  departureTime: string
  arrivalTime: string  
  bookingReference: string
  qrCode: string
  issuedAt: string       
}

export interface GenerateBoardingPassResponse {
  success: boolean
  message: string
  data: BoardingPassDto
}

export interface VerifyBoardingPassResponse {
  success: boolean
  valid: boolean
  message: string
  data?: {
    passId: string
    passengerName: string
    flightNumber: string
    origin: string
    destination: string
    seatNumber: string
    gate: string
    boardingTime: string
    departureTime: string
    bookingReference: string
    bookingStatus: string
    checkinStatus: string
  }
}