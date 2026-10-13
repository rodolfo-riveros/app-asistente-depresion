import { app, asistente, lineaAyuda } from '../../constants/asistente';

/**
 * Términos de uso y política de privacidad (texto mostrado en la app).
 *
 * Redactado a partir de lo que la app y el backend HACEN de verdad
 * (ver `notas/Decisiones.md` y el backend). Si cambia un proveedor o qué se
 * guarda, hay que actualizar este texto.
 *
 * PENDIENTE antes de publicar (no inventar):
 * - `CONTACTO`: correo real de la persona responsable de los datos.
 * - Revisión por alguien con conocimiento legal (Ley N.º 29733 de Protección
 *   de Datos Personales del Perú y su reglamento; los datos de salud son
 *   "datos sensibles" y requieren consentimiento expreso).
 */

export const ACTUALIZADO = '12 de octubre de 2026';

/** Correo de contacto para ejercer derechos. Vacío = aún no definido. */
export const CONTACTO = '';

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

const contacto = CONTACTO
  ? `escribe a ${CONTACTO}`
  : 'usa el contacto que se publicará en esta sección antes del lanzamiento';

export const privacidad: SeccionLegal[] = [
  {
    titulo: 'En pocas palabras',
    parrafos: [
      `${app.nombre} guarda lo necesario para que ${asistente.nombre} te acompañe y recuerde lo que le cuentas. No vendemos tus datos ni los usamos para publicidad.`,
      'Lo que cuentas sobre tu ánimo y tu salud es información sensible. Al crear tu cuenta das tu consentimiento expreso para tratarla con los fines que se explican aquí.',
    ],
  },
  {
    titulo: 'Qué se guarda en el servidor',
    parrafos: [
      'Tu cuenta (nombre o apodo, correo y contraseña cifrada), tu perfil (edad, ciudad, ocupación y bio, si los añades; la app no guarda fotos), tus conversaciones, los resultados de tus chequeos de ánimo (escala de Hamilton) y las actividades que acuerdas.',
      'Se almacena en Supabase (base de datos y autenticación). Solo tu sesión puede consultar tus datos.',
    ],
  },
  {
    titulo: 'Qué se queda solo en tu teléfono',
    parrafos: [
      'Tu sesión, tu registro diario de ánimo, tus preferencias (recordatorio, voz) y tu persona de confianza. No se envían a ningún servidor.',
    ],
  },
  {
    titulo: 'Servicios que procesan tus mensajes',
    parrafos: [
      `Para que ${asistente.nombre} pueda responder, tus mensajes se envían a un proveedor de inteligencia artificial (por ejemplo DeepSeek o Google Gemini, según disponibilidad). Solo se envía lo necesario para generar la respuesta.`,
      'Si hablas por voz, el audio se envía a un servicio de transcripción para convertirlo en texto y no se guarda como audio.',
      'Si activas la voz en la nube, el texto de las respuestas se envía a Microsoft Azure para leerlo en voz alta.',
      `Si permites la ubicación, tu posición aproximada se envía con tus mensajes para que ${asistente.nombre} pueda recomendarte los centros de salud mental más cercanos. Puedes quitar el permiso cuando quieras en Perfil o en los ajustes del teléfono.`,
    ],
  },
  {
    titulo: 'Para qué se usan',
    parrafos: [
      `Para acompañarte en la conversación, recordar tus preferencias y acuerdos, hacer el chequeo de ánimo y generar tu ficha para que puedas compartirla con un profesional si tú decides hacerlo.`,
      'Tus datos pueden usarse de forma anonimizada y agregada con fines de investigación académica del proyecto; nunca de forma que te identifique.',
    ],
  },
  {
    titulo: 'Tus derechos',
    parrafos: [
      `Puedes acceder a tus datos, corregirlos, pedir que se borren u oponerte a su uso (derechos ARCO). Para ejercerlos, ${contacto}.`,
      'Puedes editar tu perfil desde la pestaña Perfil y compartir tu ficha desde Registro. La ficha PDF se genera en tu teléfono e incluye tu registro de ánimo y tu persona de confianza (como contacto de emergencia); sólo sale de él si tú la compartes.',
    ],
  },
];

export const terminos: SeccionLegal[] = [
  {
    titulo: 'Qué es y qué no es',
    parrafos: [
      `${asistente.nombre} es una asistente conversacional de acompañamiento emocional. No es una persona, no es un servicio de emergencias y no sustituye a un psicólogo, psiquiatra ni a ningún profesional de la salud.`,
      'El chequeo de ánimo es una orientación basada en la escala de Hamilton, no un diagnóstico. Solo un profesional puede evaluarte.',
    ],
  },
  {
    titulo: 'Si estás en peligro',
    parrafos: [
      `Si piensas en hacerte daño o estás en peligro, llama ahora a la ${lineaAyuda.etiqueta} (${lineaAyuda.detalle}) o al SAMU 106. La app te muestra estos números y centros cercanos, pero no puede llamar a emergencias por ti.`,
    ],
  },
  {
    titulo: 'Uso de la app',
    parrafos: [
      'La app está pensada para personas mayores de 18 años. Eres responsable de mantener segura tu cuenta y tu teléfono.',
      'Las respuestas las genera una inteligencia artificial y pueden contener errores. Úsalas como apoyo, no como indicación médica.',
      'Podemos actualizar estos términos; si el cambio es importante, te lo avisaremos en la app.',
    ],
  },
];
