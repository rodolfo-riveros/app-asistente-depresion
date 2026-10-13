# Voz

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/04-voz.html`
**Archivos:** `src/screens/voz/VozScreen.tsx`, `src/screens/voz/components/OrbeVoz.tsx`, `src/screens/voz/components/OndaVoz.tsx`, `src/screens/voz/components/fases.ts`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Pantalla oscura (`voiceBg`). Cabecera: bajar (chevronDown → goBack), "Hablando con {asistente.nombre}" + temporizador mm:ss, HelpButton compact.
- Orbe de 3 círculos concéntricos + núcleo accent, animado (reanimated) según estado: escuchando / transcribiendo / pensando / hablando.
- Texto de estado + barras de onda animadas.
- Tarjeta de transcripción: último turno de la asistente y del usuario.
- Controles: Silenciar, Terminar (→ goBack), Escribir (→ Chat).
- Lógica: la del modo voz del ChatScreen original (`git show HEAD:src/screens/chat/ChatScreen.tsx`).

## Hecho
- `VozScreen.tsx`: pantalla oscura (`voiceBg`, status bar clara, safe area también abajo). Cabecera con chevronDown (corta todo y vuelve), "Hablando con {asistente.nombre}" + temporizador mm:ss desde que se abre, `HelpButton compact` → corta voz/micro y abre `CrisisProtocol`.
- Fases (`fases.ts`): `esperando` · `grabando` · `transcribiendo` · `pensando` · `hablando` · `silenciado`. Cada una con título/subtítulo propios ("Te estoy escuchando…" / "Tómate tu tiempo. No hay prisa." al grabar) y etiqueta accesible del orbe. `accessibilityLiveRegion` en el estado.
- `OrbeVoz.tsx`: 3 círculos 260/200/140 (`voiceSurface`/`voiceRing`/`accent` 55 %) + núcleo `accent` 80 px con reanimated: respira (esperando), pulsa fuerte (grabando), late suave y atenúa el aro (transcribiendo/pensando), ondula irregular (hablando), quieto y encogido (silenciado). El orbe es el botón principal: tocar = hablar / enviar / interrumpir.
- `OndaVoz.tsx`: 24 barras `sageMid` con las alturas del diseño, animadas con `scaleY` según la fase.
- Tarjeta de transcripción: último mensaje de la asistente y del usuario de `useChat().messages` (máx. 3 líneas).
- Controles: Silenciar ↔ Reactivar (corta TTS y descarta la grabación en curso; el botón se invierte a `onDark` con icono `volumeOff`), Terminar (`dangerSolid` 76 px → detiene todo y `goBack`), Escribir (si Chat está debajo → `goBack`; si no → `replace('Chat')`).
- Bucle del ChatScreen original: al abrir graba (o lee el saludo si la conversación es nueva) → tocar envía → `detenerYTranscribir` → `sendMessage` → `voz.hablar` la respuesta → al terminar vuelve a grabar. Un contador de turno invalida los `onDone` viejos (`voz.callar` dispara `onStopped`, que en el original podía relanzar la grabación dos veces). Sólo se leen respuestas a mensajes enviados desde esta pantalla (no relee el historial restaurado).
- Errores de permiso/transcripción de `useDictado` se muestran bajo el estado. Al desmontar: para reloj, TTS y grabación.
- Si `protocoloCrisisActivo` pasa a true → detiene todo y navega a `CrisisProtocol`. Si se completa la escala con resultado → `Result`. Al volver queda en "Toca el círculo para hablar".

## Desviaciones del diseño
- Nombre: `asistente.nombre` (Aurora), no "Alma" (ver [[Decisiones]]).
- Línea extra "Toca el círculo cuando termines" mientras graba: no hay detección de silencio, el usuario necesita saber cómo enviar.
- El texto de estado cambia según la fase (el diseño sólo muestra "escuchando").
- Silenciar pausa micro **y** voz (el diseño dice "Silenciar micrófono"); en pausa el botón pasa a "Reactivar".
- `useDictado` no expone el nivel del micrófono: las barras simulan la onda según la fase, no reflejan la voz real.
- Pantallas bajas (< 760 px de alto): orbe al 80 % y márgenes reducidos para que quepan los controles.
- Chevron/Terminar no piden confirmación: cortan al instante (lo dicho ya queda en el chat).

## Revisión producción (2026-10-08)
- **Permiso de micrófono** (`usePermisoMicrofono`): el modo voz ya no abre el micrófono ni el diálogo del sistema a ciegas. Fases nuevas en `fases.ts`: `preparando` (estado `cargando`, orbe quieto, "Un momento…") y `sinPermiso` ("Esperando el micrófono"; orbe atenuado y onda plana). Con `pendiente`/`bloqueado` se muestra `PermisoMicrofono tono="dark"` en lugar de la tarjeta de transcripción; tocar el orbe hace lo mismo que el botón (pedir / abrir Ajustes). `escuchar()` sale si el permiso no está concedido, así el saludo por TTS se lee pero no se graba al terminar sin permiso.
- La escucha arranca **sólo en la transición a `concedido`** (al abrir, tras "Permitir", o al volver de Ajustes). Si ya estaba concedido, volver de segundo plano deja la pantalla en espera. Si Android pasa a background durante el diálogo del permiso, se arranca al volver a `active` (`arranquePendienteRef`).
- **Segundo plano**: `AppState` → `background` corta TTS y grabación (descarta el audio), invalida turnos y no lee respuestas pendientes; al volver, "Toca el círculo para hablar".
- **Botón atrás de Android** = Terminar (`BackHandler` con `useFocusEffect`, sólo cuando Voz está al frente).
- **Escribir**: detiene todo y va a `Chat` con `{ enfocar: true }` (`popTo` si Chat está debajo, `replace` si no).
- **Hápticos** (`expo-haptics`): ligero al empezar a grabar y al enviar lo grabado; medio en Terminar/chevron.
- **Pantallas pequeñas**: zona central (orbe, estado, onda, tarjeta) en `ScrollView`; los controles quedan fuera, siempre visibles sobre la safe area inferior. Alto < 680 px: orbe al 62 %, Terminar 68 px, márgenes menores. Título de cabecera en 1 línea.
- **Accesibilidad**: etiquetas de orbe por fase (incl. "Permitir micrófono"), `accessibilityLiveRegion` en el estado, etiquetas visibles de los controles ocultas al lector (ya está el `accessibilityLabel` del botón), `hitSlop` en controles.
- **Pendiente fuera de Voz**: `ChatScreen` debe reaccionar a cambios de `route.params.enfocar` (con `popTo` la pantalla ya montada no se remonta). `useDictado` llama a `requestRecordingPermissionsAsync` en `preparar`/`iniciar` y tiene `console.error` de depuración; sus errores de permiso ya no se muestran en Voz.

## Adaptación Android/iOS (2026-10-12)
- Lógica de tamaños unificada con `useLayout` y el alto **útil** (sin safe areas): `mini` (`bajo` o < 620) → orbe 62 %, Terminar 68; `compacta` (< 740, o fuente ≥ 115 % y < 820) → orbe 80 %. Orbe y controles × `escala()`: 240 px en 360, 286 en tablet. Sustituye a los umbrales 760/680 sobre el alto bruto.
- 360×640: el centro se desplaza y los controles quedan siempre visibles sobre la safe area. Tablet: columna de `Screen` (560) y bloque central centrado en vertical.
- Cabecera y etiquetas de controles con `maxFontSizeMultiplier 1.2` y 1 línea; controles centrados con `minWidth 72`.
- Controles con onda circular `borderless` en Android (`colors.rippleOnDark`), opacidad en iOS.
- StatusBar clara vía `Screen statusBar="light"`. **Barra de navegación Android**: edge-to-edge la deja transparente con iconos oscuros (tema claro). Con 3 botones el sistema pone un velo claro (legible, pero franja clara sobre fondo oscuro); con gestos la píldora se adapta al fondo en la mayoría de launchers. Arreglo limpio: `expo-navigation-bar` + `NavigationBar.setStyle('light')` en foco / `'dark'` al salir — **no instalado**, pendiente de aprobación.
