/**
 * Momento de la conversación por voz. Decide el texto de estado y cómo se
 * mueven el orbe y las barras de onda.
 */
export type FaseVoz =
  | 'preparando' // consultando el permiso del micrófono (estado neutro)
  | 'sinPermiso' // falta el permiso del micrófono: se explica antes de pedirlo
  | 'esperando' // micrófono libre: toca para hablar
  | 'grabando' // el usuario está hablando
  | 'transcribiendo' // subiendo el audio al backend
  | 'pensando' // esperando la respuesta de la asistente
  | 'hablando' // la asistente lee su respuesta (TTS)
  | 'silenciado'; // micro y voz en pausa por el usuario
