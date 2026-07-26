import { Diagnostico, SCORE_MAXIMO, Tendencia } from '../services/diagnostico';

/**
 * Documento imprimible de la ficha de diagnóstico.
 *
 * El HTML NO usa la paleta oscura de la app a propósito: esto se imprime o se
 * envía a un profesional, así que va en negro sobre blanco, con tipografía y
 * márgenes de papel A4.
 */

const escapar = (texto: unknown): string =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fechaLarga = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fechaCorta = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

const filaDato = (etiqueta: string, valor: string): string =>
  `<div class="dato"><span class="dato-k">${escapar(etiqueta)}</span>` +
  `<span class="dato-v">${escapar(valor)}</span></div>`;

const bloqueItems = (ficha: Diagnostico): string =>
  ficha.items
    .map((item) => {
      const pendiente = !item.registrado;
      const valor = pendiente ? 'sin registrar' : `${item.valor} / ${item.maximo}`;
      return `<tr class="${pendiente ? 'pendiente' : ''}">
        <td class="num">${item.item}</td>
        <td>${escapar(item.etiqueta)}</td>
        <td class="val">${escapar(valor)}</td>
      </tr>`;
    })
    .join('');

const bloqueEvolucion = (ficha: Diagnostico): string => {
  if (ficha.evaluaciones.length < 2) return '';

  const maximo = Math.max(...ficha.evaluaciones.map((e) => e.score), 1);
  const filas = ficha.evaluaciones
    .map((evaluacion) => {
      const ancho = Math.max(2, Math.round((evaluacion.score / maximo) * 100));
      return `<tr>
        <td class="fecha">${escapar(fechaCorta(evaluacion.fecha))}</td>
        <td class="val">${evaluacion.score} / ${SCORE_MAXIMO}</td>
        <td>${escapar(evaluacion.nivel)}</td>
        <td class="barra-celda"><span class="barra" style="width:${ancho}%"></span></td>
      </tr>`;
    })
    .join('');

  return `<section class="bloque">
    <h2>Evolución del puntaje</h2>
    <table class="tabla evolucion">
      <thead><tr><th>Fecha</th><th>Puntaje</th><th>Nivel</th><th>Relativo</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </section>`;
};

const bloqueEvaluacion = (ficha: Diagnostico): string => {
  const evaluacion = ficha.ultima_evaluacion;
  if (!evaluacion) {
    return `<section class="bloque">
      <h2>Última evaluación</h2>
      <p class="vacio">Todavía no se ha completado ninguna evaluación. Los ítems registrados
      corresponden a una conversación en curso.</p>
    </section>`;
  }

  const recomendaciones = (evaluacion.recomendaciones || [])
    .map((r) => `<li>${escapar(r)}</li>`)
    .join('');

  return `<section class="bloque">
    <h2>Última evaluación</h2>
    <div class="resumen">
      <div class="puntaje">
        <span class="puntaje-num">${escapar(evaluacion.score)}</span>
        <span class="puntaje-max">/ ${SCORE_MAXIMO}</span>
      </div>
      <div class="resumen-datos">
        ${filaDato('Nivel', evaluacion.nivel)}
        ${filaDato('Fecha', fechaLarga(evaluacion.fecha))}
        ${filaDato(
          'Tendencia',
          ficha.tendencia
            ? `${TEXTO_TENDENCIA[ficha.tendencia]} — ${DESCRIPCION_TENDENCIA[ficha.tendencia]}`
            : 'sin datos suficientes'
        )}
      </div>
    </div>
    ${
      evaluacion.interpretacion
        ? `<h3>Interpretación</h3><p>${escapar(evaluacion.interpretacion)}</p>`
        : ''
    }
    ${recomendaciones ? `<h3>Recomendaciones</h3><ul>${recomendaciones}</ul>` : ''}
  </section>`;
};

/** HTML completo listo para `Print.printToFileAsync`. */
export const construirHtmlFicha = (ficha: Diagnostico): string => {
  const { perfil, progreso, actividad } = ficha;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Ficha de orientación — Escala de Hamilton</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    font-size: 11pt;
    line-height: 1.45;
    margin: 0;
  }
  header { border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 18px; }
  header h1 { font-size: 17pt; margin: 0 0 2px; letter-spacing: 0.2px; }
  header .sub { font-size: 9.5pt; color: #555555; }
  h2 {
    font-size: 12pt; margin: 0 0 8px;
    text-transform: uppercase; letter-spacing: 0.6px;
    border-bottom: 1px solid #cccccc; padding-bottom: 4px;
  }
  h3 { font-size: 10.5pt; margin: 12px 0 4px; }
  p { margin: 0 0 8px; text-align: justify; }
  ul { margin: 4px 0 8px; padding-left: 18px; }
  li { margin-bottom: 3px; }
  .bloque { margin-bottom: 20px; page-break-inside: avoid; }
  .dato { display: flex; gap: 8px; font-size: 10pt; margin-bottom: 3px; }
  .dato-k { color: #555555; min-width: 78px; }
  .dato-v { font-weight: 600; }
  .rejilla { display: flex; flex-wrap: wrap; gap: 6px 28px; }
  .rejilla .dato { min-width: 190px; }
  .resumen { display: flex; align-items: center; gap: 22px; margin-bottom: 6px; }
  .puntaje {
    border: 2px solid #1a1a1a; border-radius: 8px;
    padding: 10px 16px; text-align: center; min-width: 96px;
  }
  .puntaje-num { display: block; font-size: 26pt; font-weight: 700; line-height: 1; }
  .puntaje-max { font-size: 9pt; color: #555555; }
  .tabla { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .tabla th {
    text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px;
    color: #555555; border-bottom: 1px solid #999999; padding: 4px 6px;
  }
  .tabla td { padding: 4px 6px; border-bottom: 1px solid #e4e4e4; }
  .tabla .num { width: 26px; color: #555555; }
  .tabla .val { width: 88px; text-align: right; font-variant-numeric: tabular-nums; }
  .tabla .fecha { width: 92px; }
  .tabla tr.pendiente td { color: #909090; font-style: italic; }
  .barra-celda { width: 34%; }
  .barra { display: block; height: 7px; background: #1a1a1a; border-radius: 3px; }
  .progreso-pista {
    height: 8px; background: #e4e4e4; border-radius: 4px; overflow: hidden; margin-top: 6px;
  }
  .progreso-relleno { display: block; height: 8px; background: #1a1a1a; }
  .vacio { color: #555555; font-style: italic; }
  footer {
    margin-top: 22px; padding-top: 8px; border-top: 1px solid #cccccc;
    font-size: 8.5pt; color: #444444; text-align: justify;
  }
</style>
</head>
<body>
  <header>
    <h1>Ficha de orientación — Escala de Hamilton (HAM-D 17)</h1>
    <div class="sub">Generada el ${escapar(fechaLarga(ficha.generado_en))} · documento de apoyo para consulta profesional</div>
  </header>

  <section class="bloque">
    <h2>Persona</h2>
    <div class="rejilla">
      ${filaDato('Nombre', perfil.nombre || '—')}
      ${filaDato('Edad', perfil.edad ? `${perfil.edad} años` : '—')}
      ${filaDato('Ciudad', perfil.ciudad || '—')}
      ${filaDato('Ocupación', perfil.ocupacion || '—')}
    </div>
  </section>

  ${bloqueEvaluacion(ficha)}

  <section class="bloque">
    <h2>Cobertura de la escala</h2>
    <p>${progreso.registrados} de ${progreso.total} ítems registrados (${progreso.porcentaje}%).</p>
    <div class="progreso-pista"><span class="progreso-relleno" style="width:${Math.min(100, Math.max(0, progreso.porcentaje))}%"></span></div>
  </section>

  <section class="bloque">
    <h2>Ítems de la escala</h2>
    <table class="tabla">
      <thead><tr><th>#</th><th>Ítem</th><th class="val">Puntaje</th></tr></thead>
      <tbody>${bloqueItems(ficha)}</tbody>
    </table>
  </section>

  ${bloqueEvolucion(ficha)}

  <section class="bloque">
    <h2>Acompañamiento registrado</h2>
    <div class="rejilla">
      ${filaDato('Conversaciones', String(actividad.conversaciones))}
      ${filaDato('Mensajes', String(actividad.mensajes))}
      ${filaDato('Primera conversación', fechaCorta(actividad.primera_conversacion))}
      ${filaDato('Última conversación', fechaCorta(actividad.ultima_conversacion))}
      ${filaDato('Actividades propuestas', String(actividad.actividades_creadas))}
      ${filaDato('Actividades completadas', String(actividad.actividades_completadas))}
      ${filaDato('Tasa de cumplimiento', `${actividad.tasa_cumplimiento}%`)}
    </div>
  </section>

  <footer>${escapar(ficha.aviso)}</footer>
</body>
</html>`;
};

/** Texto breve para `Share.share`: lo justo para orientar a quien lo reciba. */
export const construirResumenTexto = (ficha: Diagnostico): string => {
  const evaluacion = ficha.ultima_evaluacion;
  const lineas: string[] = ['Ficha de orientación — Escala de Hamilton (HAM-D 17)'];

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
