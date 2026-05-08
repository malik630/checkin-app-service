//miroring my dto 

export interface UserDto {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  provider: string | null;
  createdAt: Date | null;
  lastLogin: Date | null;
  token?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDto;
  token: string;
}

export interface RegisterRequest {
  uid: string;
  email: string;
  password: string;
  display_name?: string;
  phone_number?: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string | null;
}

export interface RefreshRequest {
  refreshToken: string;
}