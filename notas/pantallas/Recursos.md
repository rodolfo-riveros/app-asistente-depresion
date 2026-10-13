# Recursos

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/08-recursos.html`
**Archivos:** `src/screens/recursos/RecursosScreen.tsx`, `src/screens/recursos/contenido.ts`, `src/screens/recursos/components/GuiaModal.tsx`, `src/screens/recursos/components/Respiracion478.tsx`, `src/screens/chat/CrisisProtocolScreen.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Título, buscador (filtra lista local), Chips (Todo, Respirar, Dormir, Ansiedad, Ánimo).
- Tarjeta destacada sage "Entender la depresión sin culparte" con ilustración SVG.
- Ejercicios con contenido real (pasos) → guía en modal; respiración 4-7-8 con temporizador animado.
- Ayuda profesional: Línea 113 (llama) y "Centros de salud mental cerca" → CrisisProtocol.
- CrisisProtocolScreen al nuevo estilo conservando llamadas, copiar, mapas, ubicación, centros Cusco.

## Hecho
- **RecursosScreen**: título, buscador píldora (filtra por título, resumen, categoría y palabras clave; sin tildes ni mayúsculas; botón para borrar), Chips de categoría en scroll horizontal, tarjeta sage destacada con la ilustración SVG (sol `accent` + colina `moss`), sección "Ejercicios" (filas blancas radio 18, `IconTile` play sobre peachPale/lavenderPale/sage según categoría), estado vacío con "Ver todos los recursos", y "Ayuda profesional" (Línea 113 → `llamarLineaAyuda`; "Centros de salud mental cerca" → `CrisisProtocol`). Ayuda profesional siempre visible aunque el filtro no encuentre nada.
- **contenido.ts**: guía "Entender la depresión sin culparte" (5 secciones de psicoeducación + aviso de que no es diagnóstico) y 6 ejercicios con pasos y nota de precaución: Respiración 4-7-8, Escaneo corporal para dormir, Tres cosas buenas de hoy, Grounding 5-4-3-2-1, Higiene del sueño, Activación conductual. Sin promesas clínicas.
- **GuiaModal**: hoja (`pageSheet` en iOS, pantalla completa en Android) fondo crema con meta, título, resumen, secciones o pasos numerados, nota en tarjeta sage y, en la guía, `HelpButton`.
- **Respiracion478**: temporizador guiado (inhala 4 · retén 7 · exhala 8, 4 ciclos) con círculo que crece/encoge con reanimated (`withTiming`), cuenta atrás, Empezar/Detener/Repetir, `accessibilityLiveRegion`, respeta `useReducedMotion`.
- **CrisisProtocolScreen**: estilo Aliento con volver; tarjeta `danger` con Línea 113 (llamar + copiar), tarjeta blanca SAMU 106 (llamar + copiar), centros de Cusco (`CUSCO_HEALTH_CENTERS`) con llamar y "Cómo llegar" (Google Maps), botón "Usar mi ubicación". Se conserva toda la lógica anterior.

## Desviaciones del diseño
- Los Chips van en un `ScrollView` horizontal (en el diseño, fila con `overflow: hidden`) para que no se corten en pantallas estrechas.
- Los ejercicios del diseño eran 3 de ejemplo; hay 6 con contenido real. El fondo del icono depende de la categoría.
- La guía destacada también responde a búsqueda/categoría (pertenece a "Ánimo"); se oculta si no coincide.
- CrisisProtocol (sin diseño de referencia): la ubicación ahora **ordena los centros por distancia real** (haversine) y muestra "A X km"; antes sólo mostraba un Alert. Si no hay permiso se informa en línea, no con Alert. Ya no se muestra `distanciaKm` estático del servicio (era un dato inventado). Titular "Estamos contigo".
- Sin ilustración en la cabecera de CrisisProtocol: tono calmado y directo a la llamada.

## Revisión producción (2026-10-08)
- **Nuevo `src/screens/recursos/enlaces.ts`**: `llamar(numero)`, `copiarNumero`, `abrirMapa(lugar)`, `toqueLigero()`. `openURL` + `catch` (no `canOpenURL`: sin `LSApplicationQueriesSchemes`/`<queries>` da falsos negativos y bloquearía una llamada de crisis). Si falla: Alert con "Copiar número" / "Copiar dirección". Háptico ligero al llamar.
- **Buscador**: scroll propio dentro de `Screen` (sin `scroll`) con `keyboardDismissMode="on-drag"` (el `interactive` de `Screen` sólo funciona en iOS) y `keyboardShouldPersistTaps="handled"` (tocar zona vacía cierra el teclado; borrar funciona al primer toque). `returnKeyType`/`enterKeyHint`/`inputMode` search, `autoCapitalize="none"`, `accessibilityRole="search"`; abrir un recurso cierra el teclado. Botón borrar = `IconButton` 44 px "Borrar búsqueda". Estado vacío con `accessibilityLiveRegion`. Tarjeta destacada con `minHeight` (no se corta con fuente grande).
- **GuiaModal**: `onRequestClose` (atrás Android y gesto de bajar en iOS), `statusBarTranslucent` + `navigationBarTranslucent` con SafeAreaView en los 4 bordes (Android edge-to-edge). Conserva el último recurso durante la animación de cierre (antes la hoja bajaba vacía). `HelpButton` usa `llamar` seguro.
- **Respiracion478**: prop `activo` (se detiene al cerrar la hoja), se detiene al pasar a segundo plano (`AppState`), un único `setTimeout` vivo siempre limpiado; háptico ligero en cada cambio de fase (sirve con los ojos cerrados).
- **CrisisProtocol** (funciona sin red: números, centros y direcciones son locales): Línea 113 primera tarjeta, a un toque, con "Copiar". Ubicación gestionada en la pantalla con `expo-location`: explicación previa en línea ("sólo en este teléfono…"), estados `denegado` / `bloqueado` (botón "Abrir Ajustes" → `Linking.openSettings`, y al volver a la app se reordena sola si se activó) / `sin-senal` (GPS apagado). `getCurrentPositionAsync` con plazo de 12 s y respaldo `getLastKnownPositionAsync` (sin red puede colgarse). Botón de ubicación 44 px.
- Pendiente compartido (fuera de mis archivos): `llamarLineaAyuda` en `components/ui/Bits.tsx` no tiene `catch` (rechazo no manejado si no hay marcador) — se usa en Inicio/Chat/Voz/Bienvenida vía `HelpButton`; `Screen` usa `keyboardDismissMode="interactive"` (no hace nada en Android); `services/location.ts` usa `console.error` y no distingue denegado/bloqueado.

## Adaptación Android/iOS (2026-10-12)
- Filas de ejercicios, tarjeta destacada y "Ayuda profesional" con `Pulsable` (local en `RecursosScreen`): `android_ripple` recortado a las esquinas (`overflow: hidden`) en Android, opacidad sólo en iOS. Altos mínimos 60–64 px.
- Ilustración de la tarjeta destacada con `viewBox` y tamaño `escala(compacto ? 92 : 110)`, anclada abajo; tarjeta con `minHeight` escalado.
- Chips: scroll horizontal sin rebote lateral en iOS ni brillo de overscroll en Android, `paddingVertical` para no recortar bordes. Buscador con `maxFontSizeMultiplier 1.35` y padding vertical por sistema.
- `GuiaModal`: cabecera y contenido en columna centrada `maxWidth 560` (tablet/iPad); título con multiplicador 1.2.
- `Respiracion478`: círculo `tablet ? 232 : escala(compacto ? 172 : 200)`, textos internos con multiplicador 1.2.
- `CrisisProtocolScreen`: pares Llamar/Copiar y teléfono/Cómo llegar apilados a ancho completo en 360 px o con fuente al 130 % ("Llamar al 113" pasa a botón grande); título de centros con `flexBasis` para que el botón de ubicación baje de línea; iconos de dirección/horario alineados arriba.
- `ErrorBoundary`: safe area 4 bordes, scroll, columna centrada `maxWidth 480`, botón corto "Llamar al 113".
