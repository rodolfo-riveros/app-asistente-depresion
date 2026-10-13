# Actividades

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/(no hay en el diseño — derivar del estilo de Inicio/Recursos)`
**Archivos:** `src/screens/actividades/ActividadesScreen.tsx`, `src/screens/actividades/actividadesUtils.ts` (nuevo)
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Pantalla apilada (con botón volver) que se abre desde Inicio.
- Conservar TODA la lógica actual: filtros (Chips), completar, borrar, crear (modal), estados vacíos/error, ir al chat.
- Estilo: tarjetas blancas radio 18, IconTile por categoría (peach/sage/lavender), Chip para filtros, Button para acciones.

## Hecho
- Reescrita al estilo Aliento con `RootScreenProps<'Actividades'>`: botón volver (`goBack`) + botón "+" (abre modal), título "Tus acuerdos".
- Lógica conservada: filtros Pendientes/Vencidas/Hechas (`Chip`), completar optimista con reversión, borrar con `Alert` de confirmación, crear con modal (título, nota, categoría, plazo), recarga al enfocar, pull-to-refresh, estados de carga/vacío/error, "Abrir el chat" → `Chat`.
- Tarjetas blancas radio 18: `IconTile` por categoría (peach/sage/lavender/neutral), meta `Categoría · Para mañana` (vencidas en `dangerInk`), círculo de check (forest al completar, título tachado) y papelera; "Lo que contaste" en caja melocotón.
- Modal: fondo `colors.scrim`, hoja crema radio 22, `TextField` + `Chip` + `Button`.
- Helpers (fecha relativa, categorías, texto "cuándo") extraídos a `actividadesUtils.ts`; también los usa Inicio.
- Corregido bug previo: el estado vacío mostraba literalmente `{asistente.nombre}`; ahora interpola el nombre.

## Desviaciones del diseño
- No hay diseño propio: derivado de Recursos/Inicio (filas blancas radio 18 con IconTile).
- Iconos de categoría del set de `Icon` (heart, user, book, plus, play, calendar) en lugar de los Ionicons anteriores.
- El error se muestra como tarjeta `danger` sobre la lista (antes era una línea gris).

## Revisión producción (2026-10-08)
- **Modal "Un nuevo acuerdo" → hoja inferior** reutilizando `profile/components/Hoja` (antes diálogo centrado con el `KeyboardAvoidingView` de `react-native`, que en Android no hacía nada). Ahora: `KeyboardAwareScrollView` de keyboard-controller, campo enfocado siempre visible, `onRequestClose`, `statusBarTranslucent` + `navigationBarTranslucent`, safe area inferior, tocar el velo cierra el teclado (y, sin teclado, la hoja).
- Campos: título `returnKeyType="next"` → nota (`submitBehavior="submit"`, no parpadea el teclado), `maxLength` 120/300. Guardar cierra el teclado y no se dispara dos veces; si falla, la hoja sigue abierta con el borrador.
- **Sin backend**: la tarjeta de error muestra un mensaje corto + botón **Reintentar** (antes sólo "desliza hacia abajo"). Spinner acotado por el timeout del cliente.
- **Hápticos**: éxito al marcar como hecho, impacto leve al desmarcar.
- Sin `console.log`.

## Adaptación Android/iOS (2026-10-12)
- Filtros con `flexWrap`: con fuente 130 % en 360 px las tres píldoras parten en dos filas en vez de salirse.
- Check de completar: onda circular (`borderless`, `colors.ripple`) en Android, opacidad en iOS.
- Hoja "Un nuevo acuerdo": hereda los cambios de `Hoja` (arrastrar para cerrar, ancho máx. 560 en tablets).
