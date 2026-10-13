import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { storage } from '../utils/storage';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

/**
 * Modo de acceso simulado (TEMPORAL; APAGADO desde 2026-10-12, el backend real
 * ya está conectado). Se conserva por si hiciera falta recorrer pantallas sin red.
 *
 * Con `EXPO_PUBLIC_AUTH_SIMULADO=true` en `.env`, login y registro no llaman
 * a la API: crean una sesión local para poder entrar a la app y recorrer las
 * pantallas. Para volver al backend real basta con poner `false` (o quitar la
 * variable) y reiniciar Expo con `npx expo start -c`.
 */
export const authSimulado = process.env.EXPO_PUBLIC_AUTH_SIMULADO === 'true';

export const TOKEN_SIMULADO = 'sesion-simulada';

/** Recuerda el último registro simulado para reutilizar el nombre al entrar. */
const KEY_USUARIO_SIMULADO = '@usuario_simulado';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "maria.lopez@x.com" → "Maria". */
const nombreDesdeEmail = (email: string): string => {
  const base = email.split('@')[0].split(/[._-]/)[0] || 'Invitado';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

const sesionSimulada = async (email: string, nombre?: string): Promise<AuthResponse> => {
  await esperar(600); // que el botón muestre su estado de carga como con la API
  const guardado = await AsyncStorage.getItem(KEY_USUARIO_SIMULADO);
  const previo: User | null = guardado ? JSON.parse(guardado) : null;
  const correo = email.trim().toLowerCase();

  const user: User = {
    id: previo?.email === correo ? previo.id : `local-${Date.now()}`,
    email: correo,
    nombre: nombre?.trim() || (previo?.email === correo ? previo.nombre : nombreDesdeEmail(correo)),
  };

  await AsyncStorage.setItem(KEY_USUARIO_SIMULADO, JSON.stringify(user));
  return { user, token: TOKEN_SIMULADO };
};

/** Guarda la sesión emitida por el backend (o la simulada). */
const guardarSesion = async (data: AuthResponse): Promise<{ user: User; token: string }> => {
  await storage.setToken(data.token);
  await storage.setRefreshToken(data.refresh_token);
  await storage.setUser(data.user);
  return { user: data.user, token: data.token };
};

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    return guardarSesion(
      authSimulado
        ? await sesionSimulada(payload.email)
        : await api.login(payload.email.trim(), payload.password)
    );
  },

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    return guardarSesion(
      authSimulado
        ? await sesionSimulada(payload.email, payload.nombre)
        : await api.register({
            ...payload,
            nombre: payload.nombre.trim(),
            email: payload.email.trim(),
          })
    );
  },

  /**
   * Comprueba con `GET /auth/me` que la sesión guardada sigue valiendo y
   * devuelve el usuario actualizado. Si el token caducó, el cliente intenta
   * renovarlo; si no puede, el 401 dispara `onUnauthorized` (vuelta al login).
   * Sin red devuelve `null` y la sesión local se mantiene.
   */
  async validarSesion(): Promise<User | null> {
    if (authSimulado) return null;
    try {
      const user = await api.me();
      await storage.setUser(user);
      return user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await storage.removeToken();
    await storage.removeUser();
  },

  async getStoredSession(): Promise<{ user: User | null; token: string | null }> {
    const token = await storage.getToken();
    const user = await storage.getUser();
    // Una sesión simulada no sirve contra el backend real: si se apaga el modo
    // simulado, se descarta para volver al login.
    if (!authSimulado && token === TOKEN_SIMULADO) {
      await this.logout();
      return { user: null, token: null };
    }
    return { user, token };
  },
};
