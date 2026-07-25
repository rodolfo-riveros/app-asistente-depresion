import { api } from './api';
import { storage } from '../utils/storage';
import { LoginPayload, RegisterPayload, User } from '../types/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    const data = await api.login(payload.email, payload.password);
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    const data = await api.register(payload);
    await storage.setToken(data.token);
    await storage.setUser(data.user);
    return data;
  },

  async logout(): Promise<void> {
    await storage.removeToken();
    await storage.removeUser();
  },

  async getStoredSession(): Promise<{ user: User | null; token: string | null }> {
    const token = await storage.getToken();
    const user = await storage.getUser();
    return { user, token };
  },
};
