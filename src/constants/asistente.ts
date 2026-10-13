/**
 * Identidad de la app y de la asistente.
 *
 * Está centralizada a propósito: el nombre aparece en la bienvenida, el chat,
 * el modo voz, el registro y el perfil. Cambiarlo aquí lo cambia en toda la app.
 *
 * OJO: no confundir con la *Escala de Hamilton* (HDRS-17), que es el
 * instrumento clínico y NO se renombra — sustenta la tesis.
 */
export const app = {
  /** Marca de la app (se escribe en minúsculas en el logotipo). */
  nombre: 'aliento',
} as const;

export const asistente = {
  /** Nombre propio. Es una acompañante, en femenino. */
  nombre: 'Aurora',
  /** Cómo se presenta en una línea. */
  descripcion: 'tu acompañante de bienestar emocional',
  /** Saludo inicial cuando aún no hay conversación previa. */
  saludo: 'Hola. Me alegra que estés aquí. ¿Cómo ha estado tu día?',
} as const;

/** Línea de ayuda que se muestra en Bienvenida, Inicio, Chat, Voz y Recursos. */
export const lineaAyuda = {
  etiqueta: 'Línea 113, opción 5',
  telefono: '113',
  detalle: 'Salud mental · gratis, 24 horas',
} as const;
