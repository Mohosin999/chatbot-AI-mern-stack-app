export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponseData {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: AuthResponseData | null;
  loading: boolean;
  error: string | null;
}
