import { useEffect } from 'react';
import { useChat } from './useChat';

export const useCrisisDetection = (onCrisisTriggered?: () => void) => {
  const { protocoloCrisisActivo } = useChat();

  useEffect(() => {
    if (protocoloCrisisActivo && onCrisisTriggered) {
      onCrisisTriggered();
    }
  }, [protocoloCrisisActivo, onCrisisTriggered]);

  return { protocoloCrisisActivo };
};
