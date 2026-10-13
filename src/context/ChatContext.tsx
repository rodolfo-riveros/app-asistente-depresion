import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, HamiltonResult, AssistantEmotion } from '../types/chat';
import { chatService } from '../services/chat';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import { asistente } from '../constants/asistente';
import { useAuth } from '../hooks/useAuth';
import { normalizarAcciones, normalizarOpciones } from '../utils/acciones';
import { olvidarUbicacion, ubicacionRapida } from '../services/ubicacion';
import type { MensajeGuardado } from '../types/api';

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
  /** Se está recuperando la conversación anterior desde el servidor. */
  restaurando: boolean;
  sendMessage: (texto: string, lat?: number, lon?: number) => Promise<void>;
  resetChat: () => void;
  closeCrisisModal: () => void;
  clearUbicacionSolicitada: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialGreeting: ChatMessage = {
  id: 'msg-0',
  role: 'assistant',
  content: asistente.saludo,
  timestamp: new Date().toISOString(),
  emotion: 'listening',
};

/** Convierte la transcripción guardada en el servidor a mensajes de la UI. */
const aMensajesUI = (guardados: MensajeGuardado[]): ChatMessage[] =>
  guardados.map((m, i) => {
    const esUsuario = m.rol === 'user';
    // Tolerante: mensajes antiguos (o un backend sin v4) no traen `acciones`.
    const acciones = esUsuario ? [] : normalizarAcciones(m.acciones);
    return {
      id: `msg-hist-${i}`,
      role: esUsuario ? 'user' : 'assistant',
      content: m.contenido,
      timestamp: m.creado_en || new Date().toISOString(),
      emotion: esUsuario ? undefined : 'empathetic',
      ...(acciones.length > 0 ? { acciones } : {}),
    };
  });

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [testCompleto, setTestCompleto] = useState<boolean>(false);
  const [protocoloCrisisActivo, setProtocoloCrisisActivo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentEmotion, setCurrentEmotion] = useState<AssistantEmotion>('listening');
  const [resultado, setResultado] = useState<HamiltonResult | null>(null);
  const [ubicacionSolicitada, setUbicacionSolicitada] = useState<boolean>(false);
  // Arranca en true: hasta que el servidor conteste no sabemos si hay una
  // conversación previa, y así no parpadea el saludo inicial antes del historial.
  const [restaurando, setRestaurando] = useState<boolean>(true);

  // Al cerrar sesión no puede quedar en memoria la conversación de la persona
  // anterior: se vuelve al estado inicial. Se ajusta durante el render (patrón
  // "estado derivado de una prop") en vez de en un efecto.
  const [autenticadoAntes, setAutenticadoAntes] = useState(isAuthenticated);
  if (autenticadoAntes !== isAuthenticated) {
    setAutenticadoAntes(isAuthenticated);
    if (!isAuthenticated) {
      setMessages([initialGreeting]);
      setSesionId(null);
      setTestCompleto(false);
      setProtocoloCrisisActivo(false);
      setResultado(null);
      setUbicacionSolicitada(false);
      setCurrentEmotion('listening');
      setLoading(false);
      setRestaurando(true);
      olvidarUbicacion();
    }
  }

  /**
   * Al iniciar sesión se recupera la última conversación del servidor para
   * continuarla. Sin esto, cada arranque de la app empezaba de cero aunque el
   * backend sí tuviera guardada la charla.
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    let activo = true;

    const restaurar = async () => {
      // `await` de entrada: ningún setState ocurre de forma síncrona aquí.
      // El backend mantiene un hilo único por persona, así que esto trae toda
      // la conversación, no una "sesión" concreta.
      const historial = await api.getHistorial().catch((e) => {
        console.warn('No se pudo restaurar la conversación:', e);
        return [];
      });

      if (!activo) return;

      if (historial.length > 0) {
        setMessages(aMensajesUI(historial));
      }
      setRestaurando(false);
    };

    restaurar();

    return () => {
      activo = false;
    };
  }, [isAuthenticated]);

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
      // v4: si hay permiso de ubicación, cada mensaje lleva lat/lon para que la
      // asistente recomiende los centros más cercanos. Nunca se pide permiso
      // aquí, y no se espera al GPS más de ~1,5 s (sigue en segundo plano y la
      // posición queda en caché para el siguiente mensaje).
      let coords = lat !== undefined && lon !== undefined ? { lat, lon } : null;
      if (!coords) coords = await ubicacionRapida();

      // Sin sesion_id: el backend elige el hilo único de la persona (v2). Se
      // guarda el que devuelve sólo como dato informativo.
      const response = await chatService.sendMessage(texto, undefined, coords?.lat, coords?.lon);
      setSesionId(response.sesion_id);

      const assistantText = response.respuesta || 'Te escucho atentamente...';
      const isComplete = response.test_completo || false;
      const isCrisis = response.protocolo_crisis_activo || false;
      const evalResult = response.resultado || null;

      // Select emotion based on context
      let emotion: AssistantEmotion = 'empathetic';
      if (isCrisis) emotion = 'concerned';
      else if (isComplete) emotion = 'inspiring';

      setCurrentEmotion(emotion);

      const acciones = normalizarAcciones(response.acciones);
      // v5: respuestas rápidas sólo para esta respuesta (no vienen en el historial).
      const opciones = normalizarOpciones(response.opciones);
      const assistantMsg: ChatMessage = {
        id: 'msg-ast-' + Date.now(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
        emotion,
        ...(acciones.length > 0 ? { acciones } : {}),
        ...(opciones.length > 0 ? { opciones } : {}),
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
          // Copia local de respaldo; el histórico que se muestra viene del backend.
          // Si la copia local falla no se interrumpe la conversación.
          await storage.saveEvaluation(evalResult).catch(() => {});
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
        restaurando,
        sendMessage,
        resetChat,
        closeCrisisModal,
        clearUbicacionSolicitada,
      }}>
      {children}
    </ChatContext.Provider>
  );
};
