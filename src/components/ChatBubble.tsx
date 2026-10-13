import React from 'react';
import { View } from 'react-native';
import { ChatMessage } from '../types/chat';
import { colors } from '../constants/colors';
import { asistente } from '../constants/asistente';
import { Txt } from './ui';

interface ChatBubbleProps {
  message: ChatMessage;
  /**
   * Ancho máximo en px. Lo calcula la pantalla (≈ 78 % del ancho de contenido,
   * con techo en tablet). Sin él se usa el 78 % del contenedor.
   */
  anchoMaximo?: number;
}

/**
 * Burbuja del chat (diseño Aliento).
 * - Asistente: blanca, esquina inferior izquierda casi recta (18/18/18/6).
 * - Usuario: verde bosque con texto claro, esquina inferior derecha recta (18/18/6/18).
 * La hora no va en cada burbuja: la llevan los separadores de fecha.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = React.memo(({ message, anchoMaximo }) => {
  const esAsistente = message.role === 'assistant';

  return (
    <View
      accessible
      accessibilityLabel={`${esAsistente ? asistente.nombre : 'Tú'}: ${message.content}`}
      style={{
        alignSelf: esAsistente ? 'flex-start' : 'flex-end',
        maxWidth: anchoMaximo ?? '78%',
        backgroundColor: esAsistente ? colors.surface : colors.forest,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: esAsistente ? 6 : 18,
        borderBottomRightRadius: esAsistente ? 18 : 6,
      }}>
      <Txt
        size={15}
        leading={1.45}
        color={esAsistente ? colors.ink : colors.onDark}
        // Android: corte de línea de calidad y guiones en palabras largas (enlaces, correos).
        textBreakStrategy="highQuality"
        android_hyphenationFrequency="normal"
        selectable>
        {message.content}
      </Txt>
    </View>
  );
});
