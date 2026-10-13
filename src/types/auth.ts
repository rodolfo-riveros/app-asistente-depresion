export interface User {
  id: string;
  nombre: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  /** access_token de Supabase (dura ~1 h). */
  token: string;
  user: User;
  /** Para renovar el token con `POST /auth/refresh`. Lo manda el backend desde v3.1. */
  refresh_token?: string | null;
  /** Segundos de vida del access_token. */
  expires_in?: number | null;
}
