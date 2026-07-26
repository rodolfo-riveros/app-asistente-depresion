import React, { createContext, useState, ReactNode } from 'react';
import { ChatMessage, HamiltonResult, AssistantEmotion } from '../types/chat';
import { chatService } from '../services/chat';
import { storage } from '../utils/storage';

interface ChatContextType {
  messages: ChatMessage[];
  sesionId: string | null;
  testCompleto: boolean;
  protocoloCrisisActivo: boolean;
  loading: boolean;
  currentEmotion: AssistantEmotion;
  resultado: HamiltonResult | null;
  /** El backend pidió la ubicación del usuario (tool `solicitar_ubicacion`). */
  ubicacionSolicitada: boolean;
  sendMessage: (texto: string, lat?: number, lon?: number) => Promise<void>;
  resetChat: () => void;
  closeCrisisModal: () => void;
  clearUbicacionSolicitada: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialGreeting: ChatMessage = {
  id: 'msg-0',
  role: 'assistant',
  content:
    '¡Hola! Soy Hamilton, tu acompañante y guía de bienestar. Estoy aquí para escucharte sin presiones y realizar una evaluación juntos. ¿Cómo te sientes el día de hoy?',
  timestamp: new Date().toISOString(),
  emotion: 'listening',
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [testCompleto, setTestCompleto] = useState<boolean>(false);
  const [protocoloCrisisActivo, setProtocoloCrisisActivo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentEmotion, setCurrentEmotion] = useState<AssistantEmotion>('listening');
  const [resultado, setResultado] = useState<HamiltonResult | null>(null);
  const [ubicacionSolicitada, setUbicacionSolicitada] = useState<boolean>(false);

  const sendMessage = async (texto: string, lat?: number, lon?: number) => {
    if (!texto.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-usr-' + Date.now(),
      role: 'user',
      content: texto.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await chatService.sendMessage(texto, sesionId || undefined, lat, lon);

      if (!sesionId) {
        setSesionId(response.sesion_id);
      }

      const assistantText = response.respuesta || 'Te escucho atentamente...';
      const isComplete = response.test_completo || false;
      const isCrisis = response.protocolo_crisis_activo || false;
      const evalResult = response.resultado || null;

      // Select emotion based on context
      let emotion: AssistantEmotion = 'empathetic';
      if (isCrisis) emotion = 'concerned';
      else if (isComplete) emotion = 'inspiring';

      setCurrentEmotion(emotion);

      const assistantMsg: ChatMessage = {
        id: 'msg-ast-' + Date.now(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
        emotion,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (isCrisis) {
        setProtocoloCrisisActivo(true);
      }

      if (response.ubicacion_solicitada) {
        setUbicacionSolicitada(true);
      }

      if (isComplete) {
        setTestCompleto(true);
        if (evalResult) {
          setResultado(evalResult);
          // Caché local: permite ver el histórico sin red.
          await storage.saveEvaluation(evalResult);
        }
      }
    } catch (e) {
      console.error('Error in sendMessage:', e);
      const detalle = e instanceof Error ? e.message : 'No pude procesar tu mensaje.';
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `${detalle}\n\n¿Quieres intentar enviarlo de nuevo?`,
        timestamp: new Date().toISOString(),
        emotion: 'concerned',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        ...initialGreeting,
        id: 'msg-' + Date.now(),
        timestamp: new Date().toISOString(),
      },
    ]);
    setSesionId(null);
    setTestCompleto(false);
    setProtocoloCrisisActivo(false);
    setResultado(null);
    setUbicacionSolicitada(false);
    setCurrentEmotion('listening');
  };

  const closeCrisisModal = () => {
    setProtocoloCrisisActivo(false);
  };

  const clearUbicacionSolicitada = () => {
    setUbicacionSolicitada(false);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sesionId,
        testCompleto,
        protocoloCrisisActivo,
        loading,
        currentEmotion,
        resultado,
        ubicacionSolicitada,
        sendMessage,
        resetChat,
        closeCrisisModal,
        clearUbicacionSolicitada,
      }}>
      {children}
    </ChatContext.Provider>
  );
};
