import { colors, moodScale } from '../constants/colors';
import { app } from '../constants/asistente';
import { Diagnostico, SCORE_MAXIMO, Tendencia } from '../services/diagnostico';
import { Actividad, actividadesService } from '../services/actividades';
import { NIVELES_HAMILTON, indiceNivel } from '../screens/registro/components/Severidad';
import { animo, claveDia, RegistroAnimo } from './animo';
import { PersonaConfianza, preferencias } from './preferencias';

/**
 * Informe para el psicólogo (PDF A4 vía expo-print).
 *
 * Pensado para leerse impreso: tinta oscura sobre blanco, tipografía del
 * sistema, acentos sobrios de la paleta Aliento (interpolados desde `colors`,
 * nunca escritos a mano). Nada se inventa: lo que falta sale como
 * "Sin registro".
 *
 * Fuentes de datos:
 * - `GET /diagnostico` (perfil, última evaluación, ítems, evolución, actividad).
 * - `GET /actividades?estado=todas` (acuerdos, cumplimiento y motivos).
 * - Teléfono: registro de ánimo (`@mood_log`) y persona de confianza (`@preferencias`).
 */

/* ------------------------------------------------------------ utilidades */

const SIN_REGISTRO = 'Sin registro';
/** Días del registro de ánimo que entran en el informe. */
const DIAS_ANIMO = 14;
/** Tope de actividades listadas (las más recientes). */
const MAX_ACTIVIDADES = 20;

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const escapar = (texto: unknown): string =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const aFecha = (iso?: string | null): Date | null => {
  if (!iso) return null;
  // `YYYY-MM-DD` se interpreta como día local (no UTC, que lo correría un día).
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "13 de octubre de 2026" (sin depender de Intl). */
const fechaLarga = (iso?: string | null): string => {
  const d = aFecha(iso);
  return d ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : SIN_REGISTRO;
};

/** "13/10/2026". */
const fechaCorta = (iso?: string | null): string => {
  const d = aFecha(iso);
  if (!d) return SIN_REGISTRO;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

/** "13/10". */
const diaMes = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

const hora = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const valorOVacio = (v: unknown): string => {
  if (v === null || v === undefined) return SIN_REGISTRO;
  const s = String(v).trim();
  return s ? s : SIN_REGISTRO;
};

export const TEXTO_TENDENCIA: Record<Tendencia, string> = {
  mejorando: 'mejorando',
  estable: 'estable',
  empeorando: 'empeorando',
};

const DESCRIPCION_TENDENCIA: Record<Tendencia, string> = {
  mejorando: 'El puntaje bajó respecto de la evaluación anterior.',
  estable: 'El puntaje se mantiene respecto de la evaluación anterior.',
  empeorando: 'El puntaje subió respecto de la evaluación anterior.',
};

/** Colores de los tramos de severidad (de menor a mayor), sobrios en papel. */
const COLOR_TRAMO = [colors.sage, colors.sageMid, colors.peachSoft, colors.dangerSolid];

/* ------------------------------------------------------------ extras */

export interface ExtrasFicha {
  /** Nombre o apodo de la cuenta (si el perfil no trae nombre). */
  apodo?: string | null;
  correo?: string | null;
  /** Persona de confianza guardada en el teléfono (contacto de emergencia). */
  contacto: PersonaConfianza | null;
  /** Registro de ánimo local (se filtra a los últimos 14 días al dibujar). */
  animo: RegistroAnimo[];
  /** `null` = no se pudieron cargar (sin red): se indica en el informe. */
  actividades: Actividad[] | null;
}

/** Reúne lo que el informe necesita además de `/diagnostico`. Nunca lanza. */
export const reunirExtrasFicha = async (cuenta: {
  apodo?: string | null;
  correo?: string | null;
}): Promise<ExtrasFicha> => {
  const [prefs, registros, actividades] = await Promise.all([
    preferencias.obtener().catch(() => null),
    animo.listar().catch(() => [] as RegistroAnimo[]),
    actividadesService.listar('todas').catch(() => null),
  ]);
  return {
    apodo: cuenta.apodo,
    correo: cuenta.correo,
    contacto: prefs?.personaConfianza ?? null,
    animo: Array.isArray(registros) ? registros : [],
    actividades: Array.isArray(actividades) ? actividades : null,
  };
};

/* ------------------------------------------------------------ bloques */

const dato = (etiqueta: string, valor: string, ancho = false): string =>
  `<div class="dato${ancho ? ' dato-ancho' : ''}"><div class="dato-k">${escapar(etiqueta)}</div>` +
  `<div class="dato-v${valor === SIN_REGISTRO ? ' vacio' : ''}">${escapar(valor)}</div></div>`;

const seccion = (numero: number, titulo: string, cuerpo: string, clase = ''): string =>
  `<section class="bloque ${clase}"><h2><span class="h2-num">${numero}</span>${escapar(titulo)}</h2>${cuerpo}</section>`;

const bloquePersona = (ficha: Diagnostico, extras: ExtrasFicha): string => {
  const { perfil } = ficha;
  const nombre = perfil.nombre?.trim() || extras.apodo?.trim() || null;
  return `<div class="rejilla">
    ${dato('Nombre o apodo', valorOVacio(nombre))}
    ${dato('Edad', perfil.edad ? `${perfil.edad} años` : SIN_REGISTRO)}
    ${dato('Ciudad', valorOVacio(perfil.ciudad))}
    ${dato('Ocupación', valorOVacio(perfil.ocupacion))}
    ${dato('Correo', valorOVacio(extras.correo))}
    ${dato('Primera conversación', fechaCorta(ficha.actividad.primera_conversacion))}
  </div>`;
};

const bloqueContacto = (extras: ExtrasFicha): string => {
  const c = extras.contacto;
  if (!c) {
    return `<div class="caja caja-contacto">
      <p class="vacio">${SIN_REGISTRO}. La persona no ha guardado un contacto de confianza en la app.</p>
    </div>`;
  }
  return `<div class="caja caja-contacto">
    <div class="rejilla">
      ${dato('Persona de confianza', valorOVacio(c.nombre))}
      ${dato('Teléfono', valorOVacio(c.telefono))}
    </div>
    <p class="nota">Contacto elegido por la propia persona en su teléfono. Líneas de ayuda en Perú:
    Línea 113 (opción 5, salud mental) · SAMU 106.</p>
  </div>`;
};

/** Barra de severidad Hamilton: tramos proporcionales a su rango y marcador del puntaje. */
const barraSeveridad = (score: number, nivel: string | undefined): string => {
  const actual = indiceNivel(nivel, score);
  let desde = 0;
  const tramos = NIVELES_HAMILTON.map((n, i) => {
    const ancho = ((n.hasta - desde + (i === 0 ? 1 : 0)) / (SCORE_MAXIMO + 1)) * 100;
    const etiqueta = `${desde === 0 ? 0 : desde + 1}–${n.hasta}`;
    desde = n.hasta;
    return `<div class="tramo${i === actual ? ' tramo-actual' : ''}" style="width:${ancho.toFixed(2)}%;background:${COLOR_TRAMO[i]}">
      <span class="tramo-txt">${escapar(n.nivel.replace('Depresión ', ''))}<br/>${etiqueta}</span>
    </div>`;
  }).join('');
  const pos = Math.min(100, Math.max(0, (score / SCORE_MAXIMO) * 100));
  return `<div class="severidad">
    <div class="tramos">${tramos}</div>
    <div class="marcador-pista"><span class="marcador" style="left:${pos.toFixed(1)}%">▲ ${score}</span></div>
  </div>`;
};

const bloqueEvaluacion = (ficha: Diagnostico): string => {
  const evaluacion = ficha.ultima_evaluacion;
  if (!evaluacion) {
    return `<p class="vacio">${SIN_REGISTRO}: todavía no hay una evaluación Hamilton completa.
    Los ítems de la sección siguiente corresponden a una conversación en curso
    (${ficha.progreso.registrados} de ${ficha.progreso.total} registrados).</p>`;
  }

  const recomendaciones = (evaluacion.recomendaciones || [])
    .filter((r) => typeof r === 'string' && r.trim())
    .map((r) => `<li>${escapar(r)}</li>`)
    .join('');
  const tendencia = ficha.tendencia
    ? `${TEXTO_TENDENCIA[ficha.tendencia]} — ${DESCRIPCION_TENDENCIA[ficha.tendencia]}`
    : 'Sin datos suficientes (se necesita más de una evaluación).';

  return `<div class="resumen">
      <div class="puntaje">
        <div class="puntaje-num">${escapar(evaluacion.score)}</div>
        <div class="puntaje-max">de ${SCORE_MAXIMO}</div>
      </div>
      <div class="resumen-datos">
        ${dato('Nivel', valorOVacio(evaluacion.nivel), true)}
        ${dato('Fecha de la evaluación', fechaLarga(evaluacion.fecha), true)}
        ${dato('Tendencia', tendencia, true)}
      </div>
    </div>
    ${barraSeveridad(evaluacion.score, evaluacion.nivel)}
    <h3>Interpretación</h3>
    <p${evaluacion.interpretacion ? '' : ' class="vacio"'}>${escapar(evaluacion.interpretacion || SIN_REGISTRO)}</p>
    ${recomendaciones ? `<h3>Recomendaciones dadas a la persona</h3><ul>${recomendaciones}</ul>` : ''}`;
};

const bloqueItems = (ficha: Diagnostico): string => {
  const filas = ficha.items
    .map((item) => {
      const registrado = item.registrado && item.valor !== null;
      const pct = registrado ? Math.round(((item.valor ?? 0) / Math.max(1, item.maximo)) * 100) : 0;
      return `<tr class="${registrado ? '' : 'pendiente'}">
        <td class="num">${item.item}</td>
        <td>${escapar(item.etiqueta)}</td>
        <td class="val">${registrado ? `${item.valor} / ${item.maximo}` : 'No registrado'}</td>
        <td class="mini">${registrado ? `<span class="mini-pista"><span class="mini-barra" style="width:${pct}%"></span></span>` : ''}</td>
      </tr>`;
    })
    .join('');
  const suma = ficha.items.reduce(
    (t, i) => t + (i.registrado && i.valor !== null ? i.valor : 0),
    0
  );
  return `<table class="tabla">
      <thead><tr><th class="num">#</th><th>Ítem</th><th class="val">Valor</th><th class="mini">Intensidad</th></tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr><td></td><td>Ítems registrados: ${ficha.progreso.registrados} de ${ficha.progreso.total}</td><td class="val">${suma} / ${SCORE_MAXIMO}</td><td></td></tr></tfoot>
    </table>`;
};

/** Mini-gráfico SVG de la evolución (0–52) con las franjas de severidad de fondo. */
const graficoEvolucion = (evaluaciones: Diagnostico['evaluaciones']): string => {
  if (evaluaciones.length < 2) return '';
  const W = 640;
  const H = 170;
  const m = { izq: 34, der: 12, arr: 10, abj: 26 };
  const ancho = W - m.izq - m.der;
  const alto = H - m.arr - m.abj;
  const y = (v: number) => m.arr + alto - (v / SCORE_MAXIMO) * alto;
  const x = (i: number) =>
    m.izq + (evaluaciones.length === 1 ? 0 : (i / (evaluaciones.length - 1)) * ancho);

  let desde = 0;
  const franjas = NIVELES_HAMILTON.map((n, i) => {
    const r = `<rect x="${m.izq}" y="${y(n.hasta).toFixed(1)}" width="${ancho}" height="${(y(desde) - y(n.hasta)).toFixed(1)}" fill="${COLOR_TRAMO[i]}" fill-opacity="0.35"/>`;
    desde = n.hasta;
    return r;
  }).join('');
  const ejes = [0, 7, 13, 18, 52]
    .map(
      (v) =>
        `<text x="${m.izq - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="${colors.inkSoft}">${v}</text>`
    )
    .join('');
  const puntos = evaluaciones
    .map((e, i) => `${x(i).toFixed(1)},${y(e.score).toFixed(1)}`)
    .join(' ');
  const marcas = evaluaciones
    .map((e, i) => {
      const d = aFecha(e.fecha);
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(e.score).toFixed(1)}" r="3.5" fill="${colors.forest}"/>
        <text x="${x(i).toFixed(1)}" y="${(y(e.score) - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${colors.ink}">${e.score}</text>
        <text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="${colors.inkSoft}">${d ? diaMes(d) : ''}</text>`;
    })
    .join('');

  return `<svg class="grafico" viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
    ${franjas}
    <line x1="${m.izq}" y1="${y(0)}" x2="${W - m.der}" y2="${y(0)}" stroke="${colors.border}"/>
    ${ejes}
    <polyline points="${puntos}" fill="none" stroke="${colors.forest}" stroke-width="2"/>
    ${marcas}
  </svg>`;
};

const bloqueEvolucion = (ficha: Diagnostico): string => {
  const evals = ficha.evaluaciones;
  if (evals.length === 0)
    return `<p class="vacio">${SIN_REGISTRO}: no hay evaluaciones completas.</p>`;
  const filas = evals
    .map((e, i) => {
      const previa = evals[i - 1];
      const delta = previa ? e.score - previa.score : null;
      const textoDelta =
        delta === null ? '—' : delta === 0 ? '0' : delta > 0 ? `+${delta}` : `${delta}`;
      return `<tr>
        <td class="fecha">${escapar(fechaCorta(e.fecha))}</td>
        <td class="val">${e.score} / ${SCORE_MAXIMO}</td>
        <td class="val">${textoDelta}</td>
        <td>${escapar(e.nivel)}</td>
      </tr>`;
    })
    .join('');
  return `${graficoEvolucion(evals)}
    <table class="tabla">
      <thead><tr><th class="fecha">Fecha</th><th class="val">Puntaje</th><th class="val">Cambio</th><th>Nivel</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    ${evals.length === 1 ? '<p class="nota">Con una sola evaluación aún no se puede valorar la evolución.</p>' : ''}
    <p class="nota">Puntajes más bajos indican menos síntomas. Cortes: 0–7 sin depresión · 8–13 leve · 14–18 moderada · 19–52 severa.</p>`;
};

const bloqueAnimo = (extras: ExtrasFicha): string => {
  const porDia = new Map(extras.animo.map((r) => [r.dia, r.valor]));
  const hoy = new Date();
  const dias = Array.from({ length: DIAS_ANIMO }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - (DIAS_ANIMO - 1 - i));
    const v = porDia.get(claveDia(d));
    return { d, valor: typeof v === 'number' && v >= 0 && v < moodScale.length ? v : null };
  });
  const marcados = dias.filter((x) => x.valor !== null) as { d: Date; valor: number }[];

  const columnas = dias
    .map(({ d, valor }) => {
      const alto = valor === null ? 0 : 18 + valor * 14;
      const barra =
        valor === null
          ? '<span class="sin-dato">·</span>'
          : `<span class="barra-animo" style="height:${alto}px;background:${moodScale[valor].color}"></span>`;
      return `<td class="col-animo"><div class="col-zona">${barra}</div><div class="col-dia">${diaMes(d)}</div>
        <div class="col-val">${valor === null ? '—' : escapar(moodScale[valor].label)}</div></td>`;
    })
    .join('');

  const promedio = marcados.length
    ? marcados.reduce((t, x) => t + x.valor, 0) / marcados.length
    : null;
  const leyenda = moodScale
    .map(
      (m) =>
        `<span class="ley"><span class="ley-c" style="background:${m.color}"></span>${escapar(m.label)}</span>`
    )
    .join('');

  const resumen =
    promedio === null
      ? `<p class="vacio">${SIN_REGISTRO}: la persona no marcó su ánimo en los últimos ${DIAS_ANIMO} días.</p>`
      : `<p>Días registrados: <b>${marcados.length} de ${DIAS_ANIMO}</b> · Ánimo medio: <b>${escapar(moodScale[Math.round(promedio)].label)}</b> (${(promedio + 1).toFixed(1).replace('.', ',')} en una escala de 1 a 5).</p>`;

  return `${resumen}
    <table class="animo"><tr>${columnas}</tr></table>
    <div class="leyenda">${leyenda}</div>
    <p class="nota">Autorregistro diario de la persona en la app ("¿Cómo te sientes ahora?"), guardado sólo en su teléfono.</p>`;
};

const estadoActividad = (a: Actividad): { texto: string; clase: string } => {
  if (a.completada) {
    const cuando = a.completada_en ? ` el ${fechaCorta(a.completada_en)}` : '';
    return { texto: `Realizada${cuando}`, clase: 'ok' };
  }
  if (a.vencida) return { texto: 'No realizada', clase: 'no' };
  return { texto: 'Pendiente', clase: 'pend' };
};

const bloqueActividades = (ficha: Diagnostico, extras: ExtrasFicha): string => {
  const { actividad } = ficha;
  const resumen = `<div class="rejilla">
    ${dato('Actividades acordadas', String(actividad.actividades_creadas))}
    ${dato('Realizadas', String(actividad.actividades_completadas))}
    ${dato('Cumplimiento', actividad.actividades_creadas ? `${actividad.tasa_cumplimiento}%` : SIN_REGISTRO)}
    ${dato('Conversaciones', String(actividad.conversaciones))}
  </div>`;

  if (extras.actividades === null) {
    return `${resumen}<p class="vacio">No se pudo obtener el detalle de las actividades al generar el informe.</p>`;
  }
  if (extras.actividades.length === 0) {
    return `${resumen}<p class="vacio">${SIN_REGISTRO}: no hay actividades acordadas.</p>`;
  }

  const ordenadas = [...extras.actividades]
    .sort((a, b) => {
      const fa = aFecha(a.para_cuando ?? a.creado_en)?.getTime() ?? 0;
      const fb = aFecha(b.para_cuando ?? b.creado_en)?.getTime() ?? 0;
      return fb - fa;
    })
    .slice(0, MAX_ACTIVIDADES);

  const filas = ordenadas
    .map((a) => {
      const estado = estadoActividad(a);
      const motivo = a.motivo_no_realizada?.trim();
      return `<tr>
        <td>${escapar(a.titulo)}${a.categoria ? `<div class="sub">${escapar(a.categoria)}</div>` : ''}</td>
        <td class="fecha">${a.para_cuando ? escapar(fechaCorta(a.para_cuando)) : '—'}</td>
        <td><span class="estado estado-${estado.clase}">${escapar(estado.texto)}</span></td>
        <td>${motivo ? escapar(motivo) : estado.clase === 'no' ? `<span class="vacio">${SIN_REGISTRO}</span>` : '—'}</td>
      </tr>`;
    })
    .join('');

  const omitidas = extras.actividades.length - ordenadas.length;
  return `${resumen}
    <table class="tabla">
      <thead><tr><th>Actividad</th><th class="fecha">Para</th><th>Estado</th><th>Motivo si no se realizó</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    ${omitidas > 0 ? `<p class="nota">Se muestran las ${MAX_ACTIVIDADES} más recientes (${omitidas} más no incluidas).</p>` : ''}`;
};

const bloqueObservaciones = (): string => `
  <div class="obs">
    ${Array.from({ length: 6 }, () => '<div class="obs-linea"></div>').join('')}
  </div>
  <div class="firmas">
    <div class="firma"><div class="firma-linea"></div>Nombre y firma del profesional</div>
    <div class="firma"><div class="firma-linea"></div>N.º de colegiatura (C.Ps.P.) · fecha</div>
  </div>`;

/* ------------------------------------------------------------ documento */

const estilos = (): string => `
  @page { size: A4; margin: 16mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${colors.ink}; background: ${colors.white};
    font-size: 10pt; line-height: 1.45; margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header {
    display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
    border-bottom: 2px solid ${colors.forest}; padding-bottom: 10px; margin-bottom: 14px;
  }
  .marca { font-size: 20pt; font-weight: 800; color: ${colors.forest}; letter-spacing: -0.5px; line-height: 1; }
  .marca-punto { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: ${colors.accent}; margin-left: 3px; }
  .titulo { font-size: 13pt; font-weight: 700; margin-top: 6px; }
  .subtitulo { font-size: 9pt; color: ${colors.inkSoft}; }
  .emision { text-align: right; font-size: 9pt; color: ${colors.inkSoft}; }
  .emision b { color: ${colors.ink}; font-size: 10pt; }
  .aviso-top {
    background: ${colors.background}; border-left: 3px solid ${colors.accent};
    padding: 7px 10px; font-size: 8.8pt; color: ${colors.inkSoft}; margin-bottom: 14px;
  }
  h2 {
    font-size: 10.5pt; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.7px;
    color: ${colors.forest}; border-bottom: 1px solid ${colors.border}; padding-bottom: 4px;
  }
  .h2-num {
    display: inline-block; min-width: 18px; height: 18px; line-height: 18px; text-align: center;
    border-radius: 50%; background: ${colors.sage}; color: ${colors.forest};
    font-size: 8.5pt; margin-right: 8px;
  }
  h3 { font-size: 9.5pt; margin: 10px 0 3px; color: ${colors.ink}; }
  p { margin: 0 0 6px; }
  ul { margin: 3px 0 6px; padding-left: 16px; }
  li { margin-bottom: 2px; }
  b { font-weight: 700; }
  .bloque { margin-bottom: 16px; page-break-inside: avoid; }
  .bloque-largo { page-break-inside: auto; }
  .rejilla { display: flex; flex-wrap: wrap; gap: 8px 0; }
  .dato { width: 33.33%; padding-right: 10px; }
  .dato-ancho { width: 100%; }
  .dato-k { font-size: 7.8pt; color: ${colors.inkSoft}; text-transform: uppercase; letter-spacing: 0.4px; }
  .dato-v { font-size: 10pt; font-weight: 600; }
  .vacio { color: ${colors.stone}; font-style: italic; font-weight: 400; }
  .nota { font-size: 8.3pt; color: ${colors.inkSoft}; margin-top: 4px; }
  .caja { border: 1px solid ${colors.border}; border-radius: 8px; padding: 10px 12px; }
  .caja-contacto { border-color: ${colors.dangerSolid}; background: ${colors.dangerBg}; }
  .caja-contacto .dato-k, .caja-contacto .nota { color: ${colors.dangerInkSoft}; }
  .caja-contacto .dato-v { color: ${colors.dangerInk}; font-size: 11pt; }
  .resumen { display: flex; align-items: stretch; gap: 16px; margin-bottom: 10px; }
  .puntaje {
    border: 2px solid ${colors.forest}; border-radius: 10px; padding: 8px 14px;
    text-align: center; min-width: 92px; display: flex; flex-direction: column; justify-content: center;
  }
  .puntaje-num { font-size: 28pt; font-weight: 800; line-height: 1; color: ${colors.forest}; }
  .puntaje-max { font-size: 8.5pt; color: ${colors.inkSoft}; }
  .resumen-datos { flex: 1; display: flex; flex-direction: column; gap: 5px; }
  .severidad { margin: 4px 0 4px; }
  .tramos { display: flex; height: 30px; border-radius: 6px; overflow: hidden; }
  .tramo { display: flex; align-items: center; justify-content: center; text-align: center; }
  .tramo-actual { outline: 2px solid ${colors.ink}; outline-offset: -2px; }
  .tramo-txt { font-size: 7pt; line-height: 1.15; color: ${colors.ink}; }
  .marcador-pista { position: relative; height: 16px; }
  .marcador {
    position: absolute; top: 1px; transform: translateX(-50%);
    font-size: 8pt; font-weight: 700; color: ${colors.ink}; white-space: nowrap;
  }
  .tabla { width: 100%; border-collapse: collapse; font-size: 9.2pt; margin-top: 4px; }
  .tabla th {
    text-align: left; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 0.4px;
    color: ${colors.inkSoft}; border-bottom: 1px solid ${colors.stone}; padding: 4px 6px;
  }
  .tabla td { padding: 4px 6px; border-bottom: 1px solid ${colors.divider}; vertical-align: top; }
  .tabla tbody tr:nth-child(even) td { background: ${colors.background}; }
  .tabla tfoot td { font-weight: 700; border-bottom: none; border-top: 1px solid ${colors.stone}; }
  .tabla .num { width: 24px; color: ${colors.inkSoft}; }
  .tabla .val { width: 84px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tabla .fecha { width: 82px; white-space: nowrap; }
  .tabla .mini { width: 26%; }
  .tabla tr.pendiente td { color: ${colors.stone}; font-style: italic; }
  .tabla .sub { font-size: 7.8pt; color: ${colors.inkSoft}; }
  .mini-pista { display: block; height: 6px; background: ${colors.dividerSoft}; border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .mini-barra { display: block; height: 6px; background: ${colors.forest}; }
  .grafico { display: block; margin: 2px 0 6px; }
  .animo { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4px; }
  .col-animo { text-align: center; padding: 0 2px; vertical-align: bottom; }
  .col-zona { height: 78px; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid ${colors.border}; }
  .barra-animo { display: block; width: 70%; border-radius: 3px 3px 0 0; }
  .sin-dato { color: ${colors.stone}; font-size: 12pt; line-height: 1; }
  .col-dia { font-size: 7pt; color: ${colors.inkSoft}; margin-top: 2px; }
  .col-val { font-size: 6.4pt; color: ${colors.ink}; line-height: 1.1; }
  .leyenda { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 6px; font-size: 7.8pt; color: ${colors.inkSoft}; }
  .ley { display: inline-flex; align-items: center; gap: 4px; }
  .ley-c { display: inline-block; width: 9px; height: 9px; border-radius: 2px; }
  .estado { font-size: 8pt; font-weight: 700; padding: 1px 6px; border-radius: 8px; white-space: nowrap; }
  .estado-ok { background: ${colors.sage}; color: ${colors.forest}; }
  .estado-no { background: ${colors.dangerBg}; color: ${colors.dangerInk}; }
  .estado-pend { background: ${colors.surfaceMuted}; color: ${colors.inkSoft}; }
  .obs { border: 1px solid ${colors.border}; border-radius: 8px; padding: 6px 12px 12px; }
  .obs-linea { border-bottom: 1px solid ${colors.divider}; height: 24px; }
  .firmas { display: flex; gap: 28px; margin-top: 34px; }
  .firma { flex: 1; font-size: 8.3pt; color: ${colors.inkSoft}; text-align: center; }
  .firma-linea { border-top: 1px solid ${colors.ink}; margin-bottom: 4px; }
  footer {
    margin-top: 16px; padding-top: 8px; border-top: 1px solid ${colors.border};
    font-size: 8pt; color: ${colors.inkSoft}; text-align: justify;
  }
`;

/** HTML completo listo para `Print.printToFileAsync` / `Print.printAsync`. */
export const construirHtmlFicha = (ficha: Diagnostico, extras: ExtrasFicha): string => {
  const emitido = aFecha(ficha.generado_en) ?? new Date();
  let n = 0;
  const s = (titulo: string, cuerpo: string, clase = '') => seccion(++n, titulo, cuerpo, clase);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Informe de seguimiento — ${escapar(app.nombre)}</title>
<style>${estilos()}</style>
</head>
<body>
  <header>
    <div>
      <div class="marca">${escapar(app.nombre)}<span class="marca-punto"></span></div>
      <div class="titulo">Informe de seguimiento emocional</div>
      <div class="subtitulo">Escala de Hamilton para la depresión (HDRS-17) · documento para el profesional de salud mental</div>
    </div>
    <div class="emision">Fecha de emisión<br/><b>${escapar(fechaLarga(emitido.toISOString()))}</b><br/>${hora(emitido)} h</div>
  </header>

  <div class="aviso-top">Herramienta de apoyo, no diagnóstico. Los datos provienen de conversaciones
  con una asistente virtual y del autorregistro de la persona; deben valorarse en una entrevista clínica.</div>

  ${s('Datos de la persona', bloquePersona(ficha, extras))}
  ${s('Contacto de emergencia', bloqueContacto(extras))}
  ${s('Última evaluación Hamilton', bloqueEvaluacion(ficha))}
  ${s('Ítems de la escala (HDRS-17)', bloqueItems(ficha), 'bloque-largo')}
  ${s('Evolución de las evaluaciones', bloqueEvolucion(ficha))}
  ${s(`Registro de ánimo · últimos ${DIAS_ANIMO} días`, bloqueAnimo(extras))}
  ${s('Actividades acordadas y cumplimiento', bloqueActividades(ficha, extras), 'bloque-largo')}
  ${s('Observaciones del profesional', bloqueObservaciones())}

  <footer><b>Aviso legal.</b> ${escapar(ficha.aviso)} Este informe es una herramienta de apoyo y
  no constituye un diagnóstico. Contiene datos de salud (datos sensibles, Ley N.º 29733): la persona
  decidió compartirlo; trátelo con confidencialidad. Generado por la app ${escapar(app.nombre)}.</footer>
</body>
</html>`;
};

/** Reúne los datos del teléfono y arma el HTML del informe. */
export const prepararHtmlFicha = async (
  ficha: Diagnostico,
  cuenta: { apodo?: string | null; correo?: string | null }
): Promise<string> => construirHtmlFicha(ficha, await reunirExtrasFicha(cuenta));

/** Texto breve para `Share.share`: lo justo para orientar a quien lo reciba. */
export const construirResumenTexto = (ficha: Diagnostico): string => {
  const evaluacion = ficha.ultima_evaluacion;
  const lineas: string[] = ['Informe de seguimiento — Escala de Hamilton (HDRS-17)'];

  if (evaluacion) {
    lineas.push(
      `Nivel: ${evaluacion.nivel}`,
      `Puntaje: ${evaluacion.score} de ${SCORE_MAXIMO}`,
      `Fecha: ${fechaLarga(evaluacion.fecha)}`
    );
    if (ficha.tendencia) lineas.push(`Tendencia: ${TEXTO_TENDENCIA[ficha.tendencia]}`);
  } else {
    lineas.push('Aún no hay una evaluación completa.');
  }

  lineas.push(
    `Ítems registrados: ${ficha.progreso.registrados} de ${ficha.progreso.total}`,
    `Acompañamiento: ${ficha.actividad.conversaciones} conversaciones, ` +
      `${ficha.actividad.actividades_completadas} de ${ficha.actividad.actividades_creadas} actividades completadas`,
    '',
    ficha.aviso
  );

  return lineas.join('\n');
};
