# Registro

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/05-registro.html`
**Archivos:** `src/screens/registro/RegistroScreen.tsx`, `src/screens/registro/components/Severidad.tsx`, `src/screens/registro/components/Graficas.tsx`, `src/screens/chat/ResultScreen.tsx`, `src/components/ResultCard.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Cabecera: rango de la semana + "Tu registro" + botón candado (privacidad).
- "Ánimo de la semana": 7 barras con `animo.semanaActual()`, frase resumen honesta.
- "Chequeo de ánimo": puntaje Hamilton real (/52), nivel, segmentos de severidad, aviso "orientación, no diagnóstico". Progreso si incompleto.
- "Lo que {asistente.nombre} ha notado": ítems Hamilton registrados con valor > 0.
- Tarjeta sage psicólogo: "Ver especialistas" → CrisisProtocol, "Compartir resumen" → ficha PDF actual.
- Conservar evolución/historial, refresco, errores. ResultScreen + ResultCard al nuevo estilo.

## Hecho
- `RegistroScreen` reescrita con primitivas `ui` (`TabScreenProps<'RegistroTab'>`): cabecera con el rango de la semana actual calculado ("5 oct – 11 oct") + "Tu registro" + botón candado que abre un `Alert` explicando la privacidad.
- "Ánimo de la semana": 7 barras desde `animo.semanaActual()` (valor 0–4 → proporción 0.2–1 × 62 px; umbrales del diseño: >0.7 `accent`, >0.42 `sageMid`, resto `sageLight`; sin dato = barra de 6 px `neutralPale`). Frase resumen calculada (días registrados, mejor y peor día con la etiqueta de `moodScale`) o invitación a marcar el ánimo desde Inicio. Se muestra aunque falle el backend.
- "Chequeo de ánimo": etiqueta "Hamilton · registrados de total", puntaje real /52, frase del nivel, 4 segmentos de severidad con el actual en `accent` + anillo `ink` (outline), nivel y fecha, tendencia (mejorando / estable / más difícil) y aviso de orientación. Sin evaluación: progreso del test (`ProgressBar`) + botón "Hablar con {asistente.nombre}" → `Chat`.
- "Lo que {asistente.nombre} ha notado": ítems Hamilton registrados con valor > 0, ordenados por intensidad; punto `accent` si valor/máximo ≥ 0.5, `moss` si menor; "valor/máximo". Estados vacíos honestos.
- "Evolución" (≥ 2 evaluaciones, últimas 8): columnas `sageLight`, la última en `accent`, "más bajo es mejor".
- Tarjeta sage: "Ver especialistas" → `CrisisProtocol`; "Compartir resumen" → PDF con `expo-print` + `expo-sharing` (plan B `Share.share` con `construirResumenTexto`); "Guardar o imprimir" (`Print.printAsync`) como botón ghost debajo. Deshabilitados si no hay nada registrado.
- Conservado: pull-to-refresh, recarga al enfocar (`useFocusEffect`), carga y tarjeta de error con "Reintentar".
- `ResultCard`: tarjeta blanca con el mismo bloque de puntaje/segmentos, fecha, interpretación, recomendaciones (puntos `moss`) y aviso.
- `ResultScreen` (`RootScreenProps<'Result'>`): volver, título, `ResultCard`, tarjeta sage (especialistas / compartir texto), "Hacer otra evaluación" (`resetChat` + `Chat`) y "Guardar en este dispositivo" (`storage.saveEvaluation`). Estado vacío si no llega resultado.
- Piezas en `src/screens/registro/components/`: `Severidad.tsx` (niveles Hamilton, `SeveridadSegmentos`, `fraseNivel`; también la usa `ResultCard`) y `Graficas.tsx` (`BarrasSemana`, `resumenSemana`, `rangoSemana`, `GraficaEvolucion`).

## Desviaciones del diseño
- PHQ-9 (0–27, 5 tramos) → Hamilton (0–52, 4 tramos: sin depresión / leve / moderada / severa), según [[Decisiones]]. Si el backend devuelve un nivel no reconocido, el tramo se deduce del puntaje (≤7, ≤13, ≤18, >18).
- Subtítulo "según tus conversaciones" → "según lo que marcaste": las barras salen del check-in local de Inicio, no del chat.
- La frase de ejemplo ("tu ánimo suele bajar por las noches…") no se puede calcular (un registro por día, sin hora ni contexto); se usa un resumen de mejor/peor día.
- "Lo que ha notado" muestra "valor/máximo" del ítem Hamilton en vez de "N veces" (el backend no cuenta repeticiones).
- Añadidos que no están en el diseño: tendencia, gráfica de evolución, "Guardar o imprimir", estado de progreso/vacío con acceso al chat, tarjeta de error.
- Se omite el bloque "Acompañamiento" (conversaciones/mensajes/actividades) de la ficha antigua: no está en el diseño y Perfil muestra estadísticas; sigue incluido en el PDF.
- No se usa `formatters.getSeverityColor`: referencia tokens del tema viejo (`colors.primary`, `warning`, `danger`) que ya no existen.

## Revisión producción (2026-10-08)
- **Sin spinner a pantalla completa**: Registro se dibuja al instante. El "Ánimo de la semana" (local, `@mood_log`) se pinta en cuanto se lee, sin esperar a la API; el chequeo muestra una tarjeta "Trayendo tu chequeo de ánimo…" en su sitio. Antes, con el backend caído, la pantalla entera quedaba en carga hasta agotar timeout + reintentos (~1 min).
- **Error legible**: "No pudimos traer tu chequeo" + primera frase del error de la API (se omite la pista técnica de Render) + aviso de que el ánimo semanal sigue disponible + botón "Reintentar" con estado de carga. Sin cifras inventadas: sin ficha no se muestra puntaje.
- **Peticiones solapadas** (enfoque + pull-to-refresh + reintentar): sólo la última escribe estado (`useRef` contador).
- **PDF**: `expo-print` / `expo-sharing` se cargan con `import()` diferido; si el módulo nativo no existe o falla, "Compartir resumen" cae a `Share.share` con el resumen en texto y "Guardar o imprimir" muestra un aviso amable. Los errores ya no muestran mensajes nativos crudos.
- **ResultScreen**: compartir sin `console.error` (Alert si falla), texto sin líneas vacías si faltan fecha/interpretación; "Guardar en este dispositivo" con carga, se bloquea tras guardar ("Guardado en este dispositivo") para no duplicar el historial.
- **360×640**: cabeceras "Chequeo de ánimo"/"Ánimo de la semana" y de `ResultCard` con `flexWrap` (la etiqueta "Hamilton · Depresión moderada" ya no empuja el título). `Graficas` tolera valores de ánimo fuera de rango en `@mood_log`.
- Tab bar: no es absoluta (va en flujo), no tapa contenido.
- Pendiente compartido (fuera de mis archivos): `storage.saveEvaluation` traga el error con `console.error`, así que "Guardado" se confirma aunque falle AsyncStorage.

## Adaptación Android/iOS (2026-10-12)
- `Graficas.tsx`: ancho real con `onLayout`. Barras de la semana: hueco proporcional (4–12 px), ancho máx. 40 px (tablet), zona de barras de 62 px fijos y letras debajo en flujo (con fuente al 130 % ya no se salen del contenedor de 84 px). Evolución: fecha en dos líneas (día / mes) cuando "12 oct" no cabe en la columna; 6 evaluaciones en vez de 8 si el ancho efectivo (`anchoContenido / fontScale`) es < 340.
- Puntaje grande (Registro y `ResultCard`) con `maxFontSizeMultiplier 1.2` y fila con `flexWrap`; etiqueta "Hamilton · nivel" con `maxWidth 100%`.
- Cabecera con título flexible (el candado no lo empuja). "Evolución / más bajo es mejor" con `flexWrap`.
- "Ver especialistas" + "Compartir resumen" (y en `ResultScreen` "Ver especialistas" + "Compartir") se apilan a ancho completo si `anchoContenido / min(fontScale, 1.35) < 380` (360 px, o fuente al 130 %); en fila en 390–430 px y tablet.
- Tablet: el centrado lo hace `Screen` (maxWidth 560).

## v5 (2026-10-13)
Ver [[Chat v5 y build]].
- **Informe PDF para el psicólogo** rediseñado (`utils/fichaPdf.ts`, `prepararHtmlFicha`): A4 con marca "aliento" y fecha de emisión; datos de la persona (incl. correo de la cuenta), contacto de emergencia (persona de confianza del teléfono), última evaluación con barra de severidad, 17 ítems, evolución (SVG + tabla), ánimo de 14 días (`@mood_log`), actividades con cumplimiento y motivos, tendencia, aviso legal y espacio para observaciones/firma. "Sin registro" donde falte. `printToFileAsync` a 595×842 pt (A4).
- "Imprimir" y "Compartir" usan el mismo HTML; el resumen en texto (plan B) no cambia de contenido.
