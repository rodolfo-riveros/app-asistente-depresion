import AsyncStorage from '@react-native-async-storage/async-storage';
import { HamiltonResult } from '../types/chat';

const KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  EVALUATION_HISTORY: '@eval_history',
  ONBOARDED: '@onboarded',
};

export const storage = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      console.error('Error getting auth token:', e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (!token) return;
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.error('Error saving auth token:', e);
    }
  },

  /** Borra access y refresh token. */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.REFRESH_TOKEN]);
    } catch (e) {
      console.error('Error removing auth token:', e);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string | null | undefined): Promise<void> {
    try {
      if (token) await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, token);
      else await AsyncStorage.removeItem(KEYS.REFRESH_TOKEN);
    } catch (e) {
      console.error('Error saving refresh token:', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const json = await AsyncStorage.getItem(KEYS.USER_DATA);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.error('Error reading user data:', e);
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    if (!user) return;
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user data:', e);
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER_DATA);
    } catch (e) {
      console.error('Error removing user data:', e);
    }
  },

  async getHistory(): Promise<any[]> {
    try {
      const json = await AsyncStorage.getItem(KEYS.EVALUATION_HISTORY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Error reading evaluation history:', e);
      return [];
    }
  },

  /** Lanza si no se pudo guardar, para que la pantalla no confirme en falso. */
  async saveEvaluation(evaluation: HamiltonResult): Promise<void> {
    const current = await this.getHistory();
    const updated = [evaluation, ...current];
    await AsyncStorage.setItem(KEYS.EVALUATION_HISTORY, JSON.stringify(updated));
  },

  async isOnboarded(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setOnboarded(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
    } catch (e) {
      console.error('Error saving onboarded flag:', e);
    }
  },
};
