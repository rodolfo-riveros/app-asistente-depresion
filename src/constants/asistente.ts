/**
 * Identidad de la asistente.
 *
 * Está centralizada a propósito: el nombre aparece en la bienvenida, el chat,
 * el modo voz, la ficha compartida y los textos vacíos. Cambiarlo aquí lo
 * cambia en toda la app.
 *
 * OJO: no confundir con la *Escala de Hamilton* (HDRS-17), que es el
 * instrumento clínico y NO se renombra — sustenta la tesis.
 */
export const asistente = {
  /** Nombre propio. Es una acompañante, en femenino. */
  nombre: 'Aurora',
  /** Cómo se presenta en una línea. */
  descripcion: 'tu acompañante de bienestar emocional',
  /** Saludo inicial cuando aún no hay conversación previa. */
  saludo:
    'Hola, soy Aurora. Estoy aquí para escucharte, sin prisa y sin juzgarte. ' +
    '¿Cómo te sientes hoy?',
} as const;
