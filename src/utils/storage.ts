import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  EVALUATION_HISTORY: '@eval_history',
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
    try {
      await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.error('Error saving auth token:', e);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    } catch (e) {
      console.error('Error removing auth token:', e);
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

  async saveEvaluation(evaluation: any): Promise<void> {
    try {
      const current = await this.getHistory();
      const updated = [evaluation, ...current];
      await AsyncStorage.setItem(KEYS.EVALUATION_HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving evaluation:', e);
    }
  },
};
