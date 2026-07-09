export interface ITokenPayload {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface IRefreshTokenResult {
  refreshToken: string;
  expiresAt: Date;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}
