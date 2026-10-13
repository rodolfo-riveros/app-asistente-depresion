# Chat

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/03-chat.html`
**Archivos:** `src/screens/chat/ChatScreen.tsx`, `src/components/ChatBubble.tsx`, `TypingIndicator.tsx`, `CrisisAlert.tsx`, `LocationPermissionModal.tsx`, `WelcomeModal.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Cabecera 72 px: volver, avatar (círculo sage con punto accent), nombre + "Aquí contigo", botón voz (→ Voz), HelpButton compact (→ CrisisProtocol).
- Burbujas: asistente blanca radio 18/18/18/6; usuario forest radio 18/18/6/18, texto claro. Separadores de fecha ("Hoy · 23:14").
- Input píldora 48 + botón micrófono (dictado con `useDictado` → rellena el input) + enviar (ink).
- Conservar: restaurando historial, typing, crisis, ubicación solicitada, resultado → Result, bienvenida.
- **Quitar el modo voz embebido**: ahora vive en VozScreen.
- Chequeo: si hay progreso del test se puede mostrar tarjeta de progreso; nunca opciones de respuesta inventadas.

## Hecho
- `src/screens/chat/ChatScreen.tsx` reescrita (pantalla raíz, `RootScreenProps<'Chat'>`): cabecera 72 px, lista con separadores de fecha, barra de entrada píldora 48 + micrófono + enviar (ink). Sin `StyleSheet`, sin hex.
  - Lógica conservada: `restaurando` (spinner "Recuperando tu conversación…"), typing indicator, scroll al final (mensajes, typing y teclado), `testCompleto && resultado` → `navigate('Result')`, bienvenida (`storage.isOnboarded`), crisis (`protocoloCrisisActivo` → `CrisisAlert`), `ubicacionSolicitada` → `LocationPermissionModal` → `sendMessage(…, lat, lon)` + hoja de centros de Cusco.
  - Cabecera: volver (`goBack`, o Inicio si no hay pila), onda → `Voz`, "Ayuda ya" → `CrisisProtocol`. Estado "Aquí contigo" / "Escribiendo…".
  - Micrófono: `useDictado` (grabar → `detenerYTranscribir`) y **rellena el input** (concatena si ya había texto) para revisar antes de enviar. Estado/errores del dictado en una línea sobre la barra. Se cancela la grabación al salir.
  - Progreso del chequeo: `diagnosticoService.obtener()` al entrar y tras cada respuesta; tarjeta "CHEQUEO DE ÁNIMO · X de 17" con `ProgressBar` (solo si 0 < registrados < total). Si `registrados` sube tras una respuesta aparece "Anotado en tu registro · Ver" → `MainApp/RegistroTab`. Sin botones de respuesta (ver [[Decisiones]]).
  - Eliminado el modo voz embebido (voiceCall/hablando/HologramAvatar/VoiceWave) y el modal de perfil del avatar.
- `src/components/ChatBubble.tsx`: asistente blanca 18/18/18/6, usuario `forest` 18/18/6/18 con texto `onDark`, 15 px / 1.45, texto seleccionable. Misma API (`message`).
- `src/components/TypingIndicator.tsx`: burbuja blanca con 3 puntos `moss` que laten.
- `src/components/CrisisAlert.tsx`: hoja inferior blanca sobre `scrim`: "ESTAMOS CONTIGO", filas `dangerBg` que llaman a 113 y 106, "Buscar centros cercanos en Cusco" y nueva prop opcional `onOpenProtocol` ("Ver todas las opciones de ayuda" → `CrisisProtocol`).
- `src/components/LocationPermissionModal.tsx` y `WelcomeModal.tsx`: tarjetas blancas planas sobre `scrim`, `IconTile`, `Button` (outline/primary). Misma API.
- Nuevos en `src/screens/chat/components/`: `ChatHeader.tsx` (+ `AvatarAsistente`), `SeparadorFecha.tsx` (`etiquetaFecha`: "Hoy · 23:14" / "Ayer · …" / "12 oct · …"; separador al cambiar de día o tras ≥ 60 min), `ProgresoChequeo.tsx` (+ `AnotadoEnRegistro`), `CentrosSheet.tsx` (hoja inferior de centros, teléfono pulsable).
- tsc y eslint limpios en estos archivos.

## Desviaciones del diseño
- **Tarjeta del chequeo**: va fija bajo la cabecera (no dentro del hilo) y sin pregunta ni opciones: el backend pregunta en texto libre y no expone la pregunta actual.
- **Tarjeta "Respiración 4-7-8"** dentro de una burbuja: no se reproduce; el backend no envía tarjetas de actividad en el chat.
- **Micrófono**: en el diseño enlaza a Voz; aquí dicta y rellena el campo (lo pidió la tarea). El modo voz completo sigue en el botón de onda de la cabecera.
- **Sin hora en cada burbuja**: la hora la dan los separadores de fecha, como en el diseño.
- **CrisisAlert sin "Copiar número"** (antes solo mostraba un aviso falso de copiado).
- **Teclado**: `KeyboardAvoidingView` con `behavior="padding"` en ambas plataformas (Android es edge-to-edge en SDK 56). Conviene probarlo en dispositivo Android.

## Revisión producción (2026-10-08)
- **Teclado**: `KeyboardAvoidingView` de `react-native-keyboard-controller` (`behavior="padding"`) en vez del de `react-native`. La barra reserva siempre `max(insets.bottom, 8)` y el KAV usa `keyboardVerticalOffset={-esa holgura}`: con teclado cerrado la píldora queda sobre la safe area; abierto, a 10 px del teclado y sin hueco. Ya no hay estado `keyboardVisible` ni listeners de `Keyboard`.
  - Scroll: `KeyboardEvents 'keyboardDidShow'` → `scrollToEnd`; `onLayout`/`onContentSizeChange` mantienen la lista pegada al final mientras se encoge (solo si el usuario estaba a < 120 px del final, para no arrancarlo de mensajes antiguos).
  - Píldora: un `Pressable` envuelve el `TextInput`, tocar cualquier parte enfoca. `multiline`, crece hasta `maxHeight` 120; `returnKeyType="default"` + `submitBehavior="newline"` (Intro = salto de línea, se envía con el botón); `autoCapitalize="sentences"`, `autoComplete="off"`.
- **`enfocar`**: efecto sobre `route.params?.enfocar` (sirve también con `popTo('Chat', { enfocar: true })` sin remontar). Enfoca en `transitionEnd` (respaldo 500 ms) y limpia con `setParams({ enfocar: undefined })`.
- **Micrófono**: `usePermisoMicrofono`. Si no está `concedido`, se cierra el teclado y aparece `PermisoMicrofono` sobre la barra (+ "Ahora no"); "Permitir micrófono" → `pedir()` → si se concede empieza a dictar; `bloqueado` → "Abrir ajustes" (la tarjeta se oculta sola al volver con el permiso). `dictado.iniciar()` solo se llama con el permiso concedido.
- **Hápticos** (`expo-haptics`, `ImpactFeedbackStyle.Light`): empezar dictado, terminar dictado, enviar.
- **Modales**: `CrisisAlert` pasa a ser `Modal` (nueva prop obligatoria `visible`; atrás de Android cierra; contenido en `ScrollView` para 360×640). Todos (`CrisisAlert`, `LocationPermissionModal`, `WelcomeModal`, `CentrosSheet`) con `onRequestClose`, `statusBarTranslucent` + `navigationBarTranslucent` y safe areas arriba/abajo; Location y Welcome desplazables en pantallas bajas.
  - iOS no presenta un Modal mientras otro se cierra: "Buscar centros cercanos" cierra el aviso de crisis y abre el de ubicación tras 350 ms; igual de ubicación → `CentrosSheet`. El aviso de crisis sigue a un toque en "Ayuda ya".
- **Linking**: `tel:` con `.catch` → `Alert` "Marca el … desde tu teléfono" (CrisisAlert y CentrosSheet). Sin `canOpenURL` (en Android 11+ da `false` sin `<queries>`).
- **Accesibilidad**: fila de teléfono en CentrosSheet a 44 px, filas de crisis ≥ 56 px, avatar decorativo de Welcome oculto a lectores, `accessibilityLiveRegion` en "Recuperando…".
- Sin `console.log`, hex ni `fontWeight` en estos archivos. tsc/eslint/prettier limpios.
- **Pendiente fuera de mis archivos**: `hooks/useDictado.ts` usa `console.error` y vuelve a llamar a `requestRecordingPermissionsAsync` (inocuo con el permiso ya concedido, pero duplica la lógica de `usePermisoMicrofono`). Probar en dispositivo Android el `keyboardVerticalOffset` negativo con barra de gestos y con botones.

## Adaptación Android/iOS (2026-10-12)
- Columna centrada (`maxWidth ANCHO_MAXIMO`) para la conversación, la tarjeta del chequeo y la barra de entrada; fondo, borde y zona de scroll a pantalla completa. Cabecera a todo el ancho (como las apps nativas en tablet).
- Burbujas: `anchoMaximo = min(440, (anchoContenido − 32) × 0,78)` en vez de `'78%'` sin techo.
- Cabecera 72 px estable con fuente al 130 %: textos 1 línea ×1.2, `minWidth: 0`, avatar 36 en `compacto`.
- Teclado: `keyboardVerticalOffset = −max(insets.bottom, 8)` **es correcto en ambos sistemas** (razonamiento completo en el comentario de `ChatScreen`): el alto del teclado de keyboard-controller se mide desde el borde inferior de la pantalla (iOS con home indicator; Android con barra de gestos o 3 botones porque `KeyboardProvider` tiene `navigationBarTranslucent`), y la barra ya reserva esa holgura. Sin el offset habría un hueco del tamaño de la safe area sobre el teclado. Si algún día se quita `navigationBarTranslucent` del `KeyboardProvider`, en Android habría que poner el offset a 0.
- `keyboardDismissMode` por plataforma; `TextInput` con `maxFontSizeMultiplier 1.35`.
- Ondas Android en mic/enviar (opacidad sólo en iOS). Modales: `CrisisAlert` y `CentrosSheet` centrados con `maxWidth` en tablet, insets laterales en todos; Ubicación apila botones con letra grande en 360 px. Ondas con `colors.ripple`/`rippleOnDark`.

## Chat como amiga (2026-10-12)
Ver [[Chat como amiga]].
- **Botones de acción** bajo la burbuja de la asistente (`components/AccionesMensaje.tsx`), cuando el mensaje trae `acciones`: música (Spotify / YouTube Music), recurso (abre la guía en Recursos), centro (Cómo llegar / Llamar), buscar en Google Maps, llamar, actividad (→ Actividades). Filas/tarjetas blancas radio 18 con `IconTile`, píldoras `Button sm` (≥ 44 px), apiladas en 360 px o con fuente grande; ancho ≈ 90 % del contenido (techo 440). Onda Android `colors.ripple`, opacidad iOS.
- **Ubicación**: `LocationPermissionModal` se sustituye por `PermisoUbicacionHoja` (estado real del permiso, "Abrir ajustes" si está bloqueado). Sólo aparece si falta el permiso; con permiso, `ubicacion_solicitada` comparte la posición sola y "Buscar centros cercanos" (crisis) abre directamente la hoja de centros.
- Los mensajes ya llevan lat/lon automáticamente (`ChatContext`), sin bloquear el envío más de ~1,5 s.

## v5 (2026-10-13)
Ver [[Chat v5 y build]].
- **Respuestas rápidas tipo encuesta** (`components/RespuestasRapidas.tsx`): bajo el último mensaje de la asistente si trae `opciones` y no se está esperando respuesta. 2–3 → filas a todo el ancho; 4–5 → píldoras que parten línea. Borde `forest`, ≥ 44 px, háptico ligero. Tocar = enviar ese texto; desaparecen al enviar cualquier cosa. Nunca en mensajes restaurados (no se guardan en el historial). El campo de texto sigue disponible.
- **Acción `contacto_confianza`** en `AccionesMensaje` → `ContactoConfianza` (llamar / WhatsApp / SMS a la persona de confianza, o "Añadir persona de confianza" → Perfil).
- `CrisisAlert` incluye `ContactoConfianza` tras 113/106 (cierra el aviso antes de ir a Perfil).
