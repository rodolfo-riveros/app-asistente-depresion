/**
 * Contenido local de Recursos: una guía de psicoeducación y ejercicios breves.
 *
 * Criterios: lenguaje sencillo y sin culpa, sin promesas clínicas ("cura",
 * "elimina la ansiedad"), y siempre con la puerta abierta a la ayuda
 * profesional. Son técnicas de autocuidado de uso habitual en psicoterapia
 * (respiración lenta, grounding, activación conductual, higiene del sueño),
 * no un tratamiento.
 */

export type Categoria = 'respirar' | 'dormir' | 'ansiedad' | 'animo';

export const categorias: { id: Categoria | 'todo'; etiqueta: string }[] = [
  { id: 'todo', etiqueta: 'Todo' },
  { id: 'respirar', etiqueta: 'Respirar' },
  { id: 'dormir', etiqueta: 'Dormir' },
  { id: 'ansiedad', etiqueta: 'Ansiedad' },
  { id: 'animo', etiqueta: 'Ánimo' },
];

export const etiquetaCategoria: Record<Categoria, string> = {
  respirar: 'Respirar',
  dormir: 'Dormir',
  ansiedad: 'Ansiedad',
  animo: 'Ánimo',
};

export interface Seccion {
  titulo: string;
  texto: string;
}

export interface Recurso {
  id: string;
  tipo: 'guia' | 'ejercicio';
  titulo: string;
  categoria: Categoria;
  minutos: number;
  /** Una o dos frases: para qué sirve. */
  resumen: string;
  /** Pasos numerados (ejercicios). */
  pasos?: string[];
  /** Bloques de texto (guías). */
  secciones?: Seccion[];
  /** Aviso amable al final (precauciones, límites). */
  nota?: string;
  /** Muestra el temporizador guiado de respiración 4-7-8. */
  temporizador478?: boolean;
  /** Palabras extra para el buscador. */
  claves?: string[];
}

export const guiaDepresion: Recurso = {
  id: 'guia-depresion',
  tipo: 'guia',
  titulo: 'Entender la depresión sin culparte',
  categoria: 'animo',
  minutos: 5,
  resumen:
    'Qué es la depresión, cómo puede sentirse y qué suele ayudar. Para leer con calma, a tu ritmo.',
  claves: ['depresión', 'culpa', 'tristeza', 'guía', 'leer'],
  secciones: [
    {
      titulo: 'No es flojera ni falta de voluntad',
      texto:
        'La depresión es una condición de salud frecuente. En ella influyen a la vez el cuerpo, la forma en que aprendimos a pensar y lo que nos pasa en la vida: pérdidas, estrés que dura mucho, soledad. No aparece por ser débil y no se resuelve solo "echándole ganas".',
    },
    {
      titulo: 'Cómo puede sentirse',
      texto:
        'Tristeza o vacío casi todo el día, perder el interés por lo que antes disfrutabas, cansancio, dormir o comer mucho más o mucho menos, costar concentrarse, sentirte sin valor o con culpa. No hace falta tenerlo todo. Si varias de estas cosas duran más de dos semanas y te cuesta llevar tu día, vale la pena conversarlo con un profesional de salud.',
    },
    {
      titulo: 'Por qué la culpa no ayuda',
      texto:
        'La depresión suele llenar la cabeza de autocrítica: "no sirvo", "soy una carga", "debería poder solo". Esos pensamientos son parte del cuadro, no una descripción justa de quién eres. Intenta notarlos como síntomas y háblate como le hablarías a alguien que quieres.',
    },
    {
      titulo: 'Qué suele ayudar',
      texto:
        'La depresión se puede tratar. La psicoterapia y, cuando un profesional lo indica, la medicación tienen buena evidencia. En el día a día ayudan los pasos pequeños: horarios de sueño parecidos, moverte un poco, comer a tus horas, pasar un rato con alguien de confianza y hacer una actividad pequeña aunque no tengas ganas. La mejoría suele ser gradual, con días mejores y peores.',
    },
    {
      titulo: 'Cuándo pedir ayuda ya',
      texto:
        'Si piensas en hacerte daño o sientes que no quieres seguir viviendo, no esperes a sentirte peor: llama a la Línea 113, opción 5 (gratis, 24 horas) o al SAMU 106 si hay un riesgo inmediato. Contarlo es un paso valiente, no una molestia.',
    },
  ],
  nota: 'Esta guía es informativa y no reemplaza una evaluación profesional. El chequeo de la app tampoco es un diagnóstico.',
};

export const ejercicios: Recurso[] = [
  {
    id: 'respiracion-478',
    tipo: 'ejercicio',
    titulo: 'Respiración 4-7-8',
    categoria: 'respirar',
    minutos: 2,
    resumen:
      'Una respiración lenta en la que sacas el aire más despacio de lo que lo tomas. A muchas personas les ayuda a bajar la tensión del cuerpo.',
    claves: ['respirar', 'calma', 'nervios', 'ansiedad'],
    temporizador478: true,
    pasos: [
      'Siéntate o recuéstate en una postura cómoda. Puedes cerrar los ojos si te sientes bien así.',
      'Suelta el aire por la boca, sin forzar.',
      'Inhala por la nariz, en silencio, mientras cuentas hasta 4.',
      'Retén el aire contando hasta 7.',
      'Exhala por la boca, despacio, contando hasta 8.',
      'Repite el ciclo cuatro veces. Con la práctica puedes hacer algunos más.',
    ],
    nota: 'Si te mareas o retener el aire te incomoda, acorta los tiempos o vuelve a respirar con normalidad. No tiene que salir perfecto.',
  },
  {
    id: 'escaneo-corporal',
    tipo: 'ejercicio',
    titulo: 'Escaneo corporal para dormir',
    categoria: 'dormir',
    minutos: 8,
    resumen:
      'Recorrer el cuerpo con la atención, sin intentar cambiar nada. Ayuda a que la mente deje de dar vueltas antes de dormir.',
    claves: ['sueño', 'insomnio', 'relajación', 'cuerpo', 'noche'],
    pasos: [
      'Acuéstate boca arriba, con los brazos a los lados. Respira con normalidad.',
      'Lleva la atención a los pies. Nota el peso, la temperatura o el contacto con la sábana.',
      'Sube despacio: tobillos, piernas, rodillas, muslos. Si encuentras tensión, déjala estar y suelta un poco el aire.',
      'Sigue por la cadera, el abdomen y el pecho. Observa cómo se mueven al respirar.',
      'Recorre la espalda, los hombros, los brazos y las manos.',
      'Termina en el cuello, la mandíbula, los ojos y la frente. Afloja lo que puedas.',
      'Si la mente se distrae, es normal: vuelve con suavidad a la parte del cuerpo donde te quedaste.',
    ],
    nota: 'Si te quedas dormido a mitad del ejercicio, perfecto: ese era el objetivo.',
  },
  {
    id: 'tres-cosas-buenas',
    tipo: 'ejercicio',
    titulo: 'Tres cosas buenas de hoy',
    categoria: 'animo',
    minutos: 5,
    resumen:
      'Un pequeño ejercicio para entrenar la atención hacia lo que sí estuvo bien, aunque el día haya sido difícil.',
    claves: ['gratitud', 'diario', 'escribir', 'positivo'],
    pasos: [
      'Al final del día, busca un momento tranquilo y algo para escribir.',
      'Anota tres cosas que salieron bien o que disfrutaste, por pequeñas que sean: un café caliente, un mensaje, haberte levantado.',
      'Junto a cada una, escribe por qué pasó o qué papel tuviste tú.',
      'Si hoy cuesta encontrar tres, está bien empezar con una.',
      'Intenta repetirlo varios días seguidos: el efecto se nota con la práctica, no en una sola vez.',
    ],
    nota: 'No se trata de negar lo malo ni de obligarte a estar bien, sino de que lo bueno también tenga espacio.',
  },
  {
    id: 'grounding-54321',
    tipo: 'ejercicio',
    titulo: 'Grounding 5-4-3-2-1',
    categoria: 'ansiedad',
    minutos: 3,
    resumen:
      'Usar los sentidos para volver al presente cuando la ansiedad o los pensamientos se aceleran.',
    claves: ['ansiedad', 'pánico', 'sentidos', 'presente', 'anclaje'],
    pasos: [
      'Para un momento y respira un poco más lento de lo habitual.',
      'Nombra 5 cosas que puedes ver a tu alrededor.',
      'Nota 4 cosas que puedes tocar: la ropa, la silla, el suelo bajo los pies.',
      'Escucha 3 sonidos, cercanos o lejanos.',
      'Identifica 2 olores. Si no notas ninguno, piensa en dos que te gusten.',
      'Reconoce 1 sabor, o algo que puedas decirte con amabilidad.',
    ],
    nota: 'Si la ansiedad es muy intensa o se repite a menudo, conversarlo con un profesional puede ayudarte mucho.',
  },
  {
    id: 'higiene-sueno',
    tipo: 'ejercicio',
    titulo: 'Higiene del sueño',
    categoria: 'dormir',
    minutos: 4,
    resumen:
      'Hábitos sencillos que ayudan al cuerpo a reconocer cuándo es hora de descansar. Elige uno o dos para empezar.',
    claves: ['sueño', 'insomnio', 'hábitos', 'descanso', 'noche'],
    pasos: [
      'Intenta acostarte y levantarte a horas parecidas, también los fines de semana.',
      'Deja las pantallas unos 30 a 60 minutos antes de dormir o baja su brillo.',
      'Evita el café, el té negro y las bebidas energéticas por la tarde, y el alcohol por la noche.',
      'Usa la cama para dormir: si en unos 20 minutos no te duermes, levántate, haz algo tranquilo con poca luz y vuelve cuando tengas sueño.',
      'Busca luz natural por la mañana y algo de movimiento durante el día.',
      'Mantén el cuarto oscuro, silencioso y con una temperatura agradable.',
    ],
    nota: 'Dormir mucho más o mucho menos de lo habitual puede ser parte de la depresión. Si dura semanas, coméntalo con un profesional.',
  },
  {
    id: 'activacion-conductual',
    tipo: 'ejercicio',
    titulo: 'Activación conductual: una pequeña tarea',
    categoria: 'animo',
    minutos: 5,
    resumen:
      'Con depresión, las ganas suelen llegar después de actuar, no antes. Elegir una tarea pequeña y hacerla puede mover un poco el ánimo.',
    claves: ['motivación', 'tarea', 'ganas', 'actividad', 'energía'],
    pasos: [
      'Piensa en algo pequeño que antes te hacía bien o que te deja tranquilo: ducharte, salir 10 minutos, ordenar un cajón, llamar a alguien.',
      'Hazla más pequeña todavía, hasta que te parezca posible hoy.',
      'Decide cuándo la harás: "después del almuerzo", "a las 5".',
      'Hazla aunque no tengas ganas. No hace falta disfrutarla.',
      'Después, nota cómo te sientes del 0 al 10, aunque el cambio sea mínimo.',
      'Mañana, elige otra. Lo importante es la constancia, no el tamaño.',
    ],
    nota: 'Si hoy no puedes, no es un fracaso. Inténtalo con una tarea todavía más pequeña.',
  },
];

/** Minúsculas y sin tildes, para que "animo" encuentre "Ánimo". */
export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/** ¿El recurso coincide con la búsqueda y la categoría elegidas? */
export const coincide = (r: Recurso, consulta: string, categoria: Categoria | 'todo') => {
  if (categoria !== 'todo' && r.categoria !== categoria) return false;
  const q = normalizar(consulta);
  if (!q) return true;
  const texto = normalizar(
    [r.titulo, r.resumen, etiquetaCategoria[r.categoria], ...(r.claves ?? [])].join(' ')
  );
  return q.split(/\s+/).every((palabra) => texto.includes(palabra));
};
