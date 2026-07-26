import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';
import { ChatMessageRequest, ChatMessageResponse, HealthResponse } from '../types/api';
import { AuthResponse, RegisterPayload } from '../types/auth';
import { HamiltonResult } from '../types/chat';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '120000', 10);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the Supabase access token issued by the backend
client.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Se invoca cuando el backend responde 401 (token vencido o revocado en
 * Supabase). `AuthProvider` lo usa para cerrar la sesión local.
 */
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

/**
 * Convierte cualquier fallo de axios en un Error con mensaje mostrable.
 * FastAPI manda el motivo en `detail`; si no hubo respuesta, es problema de red.
 */
const normalizarError = (error: unknown, fallback: string): Error => {
  const axiosError = error as AxiosError<{ detail?: string | { msg?: string }[] }>;

  if (axiosError?.response) {
    if (axiosError.response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const detail = axiosError.response.data?.detail;
    if (typeof detail === 'string' && detail) {
      return new Error(detail);
    }
    // Errores de validación de FastAPI: [{loc, msg, type}, ...]
    if (Array.isArray(detail) && detail[0]?.msg) {
      return new Error(detail[0].msg);
    }
    return new Error(fallback);
  }

  if (axiosError?.request) {
    const esTimeout = axiosError.code === 'ECONNABORTED';
    return new Error(
      esTimeout
        ? `El servidor no respondió a tiempo (${API_BASE_URL}). Intenta de nuevo.`
        : `No se pudo conectar con el servidor (${API_BASE_URL}). ` +
            'Verifica que el backend esté corriendo y que la URL sea alcanzable desde este dispositivo.'
    );
  }

  return new Error(fallback);
};

export const api = {
  // --- Auth (Supabase Auth vía backend) ---
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    }
  },

  async register(data: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await client.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo completar el registro. Inténtalo de nuevo.');
    }
  },

  // --- Chat ---
  async sendMessage(payload: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const response = await client.post<ChatMessageResponse>('/chat/mensaje', payload);
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo enviar tu mensaje. Inténtalo de nuevo.');
    }
  },

  // --- Histórico ---
  async getEvaluaciones(limite = 50): Promise<HamiltonResult[]> {
    try {
      const response = await client.get<HamiltonResult[]>('/evaluaciones', {
        params: { limite },
      });
      return response.data;
    } catch (error) {
      throw normalizarError(error, 'No se pudo cargar tu histórico.');
    }
  },

  // --- Voz ---
  /**
   * Sube el audio grabado y devuelve la transcripción.
   * En nativo FormData acepta `{uri, name, type}`; en web hay que convertir el
   * blob URI a Blob antes de adjuntarlo.
   */
  async transcribirAudio(uri: string): Promise<string> {
    const form = new FormData();

    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('audio', blob, 'audio.webm');
    } else {
      form.append('audio', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
    }

    try {
      // Sin Content-Type explícito: axios calcula el boundary del multipart.
      const response = await client.post<{ texto: string }>('/voz/transcribir', form, {
        headers: { 'Content-Type': undefined as unknown as string },
        timeout: 120000,
      });
      return response.data.texto;
    } catch (error) {
      throw normalizarError(error, 'No se pudo transcribir el audio.');
    }
  },

  async health(): Promise<HealthResponse> {
    const response = await client.get<HealthResponse>('/salud');
    return response.data;
  },
};
