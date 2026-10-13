import { Platform } from 'react-native';
import type * as NotificationsNS from 'expo-notifications';
import { app, asistente } from '../constants/asistente';
import { Preferencias, preferencias } from '../utils/preferencias';

/**
 * Recordatorio diario: notificación LOCAL (sin servidor) a la hora elegida, en la
 * voz de la asistente. Ver `notas/Notificaciones y voz.md`.
 *
 * - Se programan los próximos `DIAS` días con fecha exacta (no un trigger DAILY)
 *   para que el mensaje varíe cada día. Se reprograma al abrir la app, al volver
 *   a primer plano y al cambiar las preferencias, así la ventana siempre avanza.
 * - Sólo se tocan las notificaciones con el prefijo `ID_PREFIJO`.
 * - `expo-notifications` se carga de forma diferida y todo va con try/catch: en
 *   web no existe y en Expo Go (Android) el módulo puede fallar al importarse.
 *   En esos casos la app sigue igual, simplemente no hay recordatorio.
 */

type Notifs = typeof NotificationsNS;

const ID_PREFIJO = 'aliento-recordatorio-';
const DIAS = 14;
const CANAL = 'recordatorio';
const CANAL_DISCRETO = 'recordatorio-discreto';
/** Vibración breve y suave (ms): espera, vibra. */
const VIBRACION = [0, 120];

/* ------------------------------------------------------- carga del módulo */

let modulo: Promise<Notifs | null> | null = null;

const cargar = (): Promise<Notifs | null> => {
  if (Platform.OS === 'web') return Promise.resolve(null);
  if (!modulo) {
    modulo = import('expo-notifications').then(
      (m) => m as Notifs,
      () => null
    );
  }
  return modulo;
};

/* --------------------------------------------------------------- textos */

export type Franja = 'mañana' | 'tarde' | 'noche';

const partesHora = (hora: string): { h: number; m: number } => {
  const [h, m] = hora.split(':').map((x) => parseInt(x, 10));
  return {
    h: Number.isFinite(h) && h >= 0 && h < 24 ? h : 21,
    m: Number.isFinite(m) && m >= 0 && m < 60 ? m : 0,
  };
};

/** Franja del día de una hora `HH:mm` (mismos cortes que el saludo de Inicio). */
export const franjaDe = (hora: string): Franja => {
  const { h } = partesHora(hora);
  if (h >= 5 && h < 12) return 'mañana';
  if (h >= 12 && h < 19) return 'tarde';
  return 'noche';
};

/** "cada noche" / "cada mañana" / "cada tarde". */
export const cadaFranja = (hora: string) => `cada ${franjaDe(hora)}`;

const n = asistente.nombre;

/** Mensajes calmados, sin culpa ni urgencia. Uno distinto cada día. */
const MENSAJES: Record<Franja, string[]> = {
  noche: [
    `Hola, soy ${n}. ¿Cómo te sientes esta noche?`,
    'Tómate un minuto para ti. ¿Cómo ha ido tu día?',
    'Antes de descansar, ¿te apetece contarme cómo estás?',
    'Sin prisa. Cuando quieras, aquí estoy para escucharte.',
    'Respira hondo un momento. ¿Cómo llegas a esta noche?',
    `Soy ${n}. Me gustaría saber cómo te fue hoy.`,
    'Un momento de calma para ti. ¿Cómo te sientes ahora?',
  ],
  tarde: [
    `Hola, soy ${n}. ¿Cómo te sientes esta tarde?`,
    'Tómate un minuto para ti. ¿Cómo va tu día?',
    'Una pausa breve: ¿cómo estás en este momento?',
    'Sin prisa. Cuando quieras, aquí estoy para escucharte.',
    `Soy ${n}. ¿Qué tal va tu tarde?`,
    'Respira hondo un momento. ¿Cómo te sientes ahora?',
  ],
  mañana: [
    `Hola, soy ${n}. ¿Cómo amaneciste hoy?`,
    'Tómate un minuto para ti antes de empezar. ¿Cómo te sientes?',
    'Buenos días. ¿Cómo estás esta mañana?',
    'Sin prisa. Cuando quieras, aquí estoy para escucharte.',
    `Soy ${n}. ¿Qué tal has descansado?`,
    'Respira hondo un momento. ¿Cómo empiezas el día?',
  ],
};

const DISCRETO = { titulo: app.nombre, cuerpo: 'Tienes un momento para ti' };

const contenidoPara = (fecha: Date, hora: string, discreto: boolean) => {
  if (discreto) return DISCRETO;
  const lista = MENSAJES[franjaDe(hora)];
  // Índice estable por día: el mismo día siempre recibe el mismo mensaje.
  const dia = Math.floor((fecha.getTime() - fecha.getTimezoneOffset() * 60_000) / 86_400_000);
  return { titulo: asistente.nombre, cuerpo: lista[dia % lista.length] };
};

/** Próximas `DIAS` fechas a la hora pedida, empezando hoy si aún no pasó. */
const proximasFechas = (hora: string, desde = new Date()): Date[] => {
  const { h, m } = partesHora(hora);
  const primera = new Date(desde);
  primera.setHours(h, m, 0, 0);
  // Margen de un minuto para no programar algo que ya "pasó" al llegar al sistema.
  if (primera.getTime() <= desde.getTime() + 60_000) primera.setDate(primera.getDate() + 1);
  return Array.from({ length: DIAS }, (_, i) => {
    const f = new Date(primera);
    f.setDate(primera.getDate() + i);
    return f;
  });
};

/* -------------------------------------------------------------- permiso */

export type EstadoPermisoNotificaciones =
  | 'cargando'
  | 'pendiente'
  | 'concedido'
  | 'bloqueado'
  /** Web, o Expo Go sin el módulo: no se puede avisar en este dispositivo. */
  | 'no-disponible';

const estadoDe = (
  N: Notifs,
  p: NotificationsNS.NotificationPermissionsStatus
): EstadoPermisoNotificaciones => {
  const iosOk =
    p.ios?.status === N.IosAuthorizationStatus.PROVISIONAL ||
    p.ios?.status === N.IosAuthorizationStatus.EPHEMERAL;
  if (p.granted || iosOk) return 'concedido';
  return p.canAskAgain ? 'pendiente' : 'bloqueado';
};

/* ---------------------------------------------------------- configuración */

let configurado: Promise<void> | null = null;

const configurarCon = async (N: Notifs) => {
  // Con la app abierta: se ve en la lista y como aviso, sin sonido (la persona
  // ya está dentro; un sonido sería invasivo).
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // Android no deja cambiar la visibilidad de un canal ya creado: por eso hay
    // uno normal y otro discreto (oculta el contenido en la pantalla bloqueada).
    const base = {
      importance: N.AndroidImportance.DEFAULT,
      enableVibrate: true,
      vibrationPattern: VIBRACION,
      showBadge: false,
      sound: 'default',
    };
    await N.setNotificationChannelAsync(CANAL, {
      ...base,
      name: 'Recordatorio diario',
      description: `${asistente.nombre} te pregunta cómo estás.`,
    });
    await N.setNotificationChannelAsync(CANAL_DISCRETO, {
      ...base,
      name: 'Recordatorio diario (discreto)',
      description: 'Sin texto en la pantalla bloqueada.',
      lockscreenVisibility: N.AndroidNotificationVisibility.PRIVATE,
    });
  }
};

/* ------------------------------------------------------------------ API */

/** Para serializar `sincronizar`: dos llamadas seguidas no duplican avisos. */
let cola: Promise<unknown> = Promise.resolve();

const cancelarPropios = async (N: Notifs) => {
  const programadas = await N.getAllScheduledNotificationsAsync();
  await Promise.all(
    programadas
      .filter((p) => p.identifier.startsWith(ID_PREFIJO))
      .map((p) => N.cancelScheduledNotificationAsync(p.identifier).catch(() => undefined))
  );
};

export const recordatorio = {
  /** Handler + canales Android. Idempotente; se llama al iniciar la app. */
  configurar(): Promise<void> {
    if (!configurado) {
      configurado = cargar()
        .then((N) => (N ? configurarCon(N) : undefined))
        .catch(() => undefined);
    }
    return configurado;
  },

  /** ¿Puede este dispositivo programar avisos? (no en web ni si el módulo falló). */
  async disponible(): Promise<boolean> {
    return (await cargar()) !== null;
  },

  async leerPermiso(): Promise<EstadoPermisoNotificaciones> {
    const N = await cargar();
    if (!N) return 'no-disponible';
    try {
      return estadoDe(N, await N.getPermissionsAsync());
    } catch {
      return 'no-disponible';
    }
  },

  /** Diálogo del sistema. En Android 13+ necesita un canal creado antes. */
  async pedirPermiso(): Promise<EstadoPermisoNotificaciones> {
    const N = await cargar();
    if (!N) return 'no-disponible';
    try {
      await recordatorio.configurar();
      return estadoDe(
        N,
        await N.requestPermissionsAsync({
          ios: { allowAlert: true, allowSound: true, allowBadge: false },
        })
      );
    } catch {
      return 'pendiente';
    }
  },

  /**
   * Cancela los recordatorios de la app y, si procede, programa los próximos
   * días. Sin `prefs`, lee las guardadas. Nunca lanza.
   */
  sincronizar(prefs?: Preferencias): Promise<void> {
    const tarea = cola.then(async () => {
      const N = await cargar();
      if (!N) return;
      try {
        await recordatorio.configurar();
        const p = prefs ?? (await preferencias.obtener());
        await cancelarPropios(N);
        if (!p.recordatorioDiario) return;
        if (estadoDe(N, await N.getPermissionsAsync()) !== 'concedido') return;

        const discreto = p.notificacionesDiscretas;
        const canal = discreto ? CANAL_DISCRETO : CANAL;
        await Promise.all(
          proximasFechas(p.horaRecordatorio).map((fecha, i) => {
            const { titulo, cuerpo } = contenidoPara(fecha, p.horaRecordatorio, discreto);
            return N.scheduleNotificationAsync({
              identifier: `${ID_PREFIJO}${i}`,
              content: {
                title: titulo,
                body: cuerpo,
                data: { abrir: 'checkin' },
                sound: 'default',
                vibrate: VIBRACION,
                priority: N.AndroidNotificationPriority.DEFAULT,
                interruptionLevel: 'active',
              },
              trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: fecha, channelId: canal },
            }).catch(() => undefined);
          })
        );
      } catch {
        // Expo Go / dispositivo sin soporte: se degrada sin avisos.
      }
    });
    cola = tarea.catch(() => undefined);
    return tarea.catch(() => undefined);
  },

  /** Al cerrar sesión: quita los recordatorios programados y los ya mostrados. */
  cancelarTodo(): Promise<void> {
    const tarea = cola.then(async () => {
      const N = await cargar();
      if (!N) return;
      try {
        await cancelarPropios(N);
        const mostradas = await N.getPresentedNotificationsAsync();
        await Promise.all(
          mostradas
            .filter((m) => m.request.identifier.startsWith(ID_PREFIJO))
            .map((m) => N.dismissNotificationAsync(m.request.identifier).catch(() => undefined))
        );
      } catch {
        // sin soporte: nada que cancelar
      }
    });
    cola = tarea.catch(() => undefined);
    return tarea.catch(() => undefined);
  },

  /**
   * Avisa cuando la persona toca un recordatorio, incluido el que abrió la app
   * en frío. Devuelve una función para dejar de escuchar.
   */
  alTocar(cb: () => void): () => void {
    let activo = true;
    let sub: { remove: () => void } | null = null;

    cargar()
      .then((N) => {
        if (!N || !activo) return;
        const esNuestra = (r: NotificationsNS.NotificationResponse | null) =>
          !!r &&
          r.actionIdentifier === N.DEFAULT_ACTION_IDENTIFIER &&
          r.notification.request.content.data?.abrir === 'checkin';

        try {
          const ultima = N.getLastNotificationResponse();
          if (esNuestra(ultima)) {
            N.clearLastNotificationResponse();
            cb();
          }
        } catch {
          // no disponible en esta plataforma
        }
        try {
          sub = N.addNotificationResponseReceivedListener((r) => {
            if (!esNuestra(r)) return;
            try {
              N.clearLastNotificationResponse();
            } catch {
              // ignorar
            }
            cb();
          });
        } catch {
          // ignorar
        }
      })
      .catch(() => undefined);

    return () => {
      activo = false;
      sub?.remove();
    };
  },
};
