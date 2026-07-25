import { api } from './api';
import { ChatMessageRequest, ChatMessageResponse } from '../types/api';

export const chatService = {
  async sendMessage(
    mensaje: string,
    sesion_id?: string,
    lat?: number,
    lon?: number
  ): Promise<ChatMessageResponse> {
    const payload: ChatMessageRequest = {
      mensaje,
      sesion_id,
      lat,
      lon,
    };
    return await api.sendMessage(payload);
  },
};
