# Perfil

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/09-perfil.html`
**Archivos:** `src/screens/profile/ProfileScreen.tsx`, `src/screens/profile/components/Hoja.tsx`, `src/screens/profile/components/EditarPerfilHoja.tsx`, `src/screens/profile/components/PersonaConfianzaHoja.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Tarjeta: avatar (foto o inicial sobre accent), nombre, "Con {asistente.nombre} desde <mes>", Editar (nombre, edad, ciudad, ocupación, bio, foto).
- 3 stats reales (conversaciones, actividades/días, chequeos) de `diagnosticoService`.
- Tarjeta sage "Persona de confianza" → modal guarda nombre+teléfono en `preferencias`; si existe, mostrar y llamar.
- Toggles: Recordatorio diario, Notificaciones discretas. Omitido bloqueo con huella.
- "Privacidad y datos" → explicación; no inventar borrado.
- Cerrar sesión con confirmación.

## Hecho
- `ProfileScreen` reescrito con `Screen` (scroll + pull-to-refresh), `Card`, `Button`, `Toggle`, `Divider`, `Icon`, `Txt/Title`. Carga en `useFocusEffect` con `Promise.allSettled` de `perfilService.obtener()`, `diagnosticoService.obtener()` y `preferencias.obtener()`; cada fallo se muestra por separado (aviso de perfil en tarjeta `danger`, stats con "—" y texto de reintento).
- Tarjeta blanca: avatar 56 (foto `foto_url` o inicial sobre `accent`), al tocarlo `expo-image-picker` → `perfilService.subirFoto` con indicador de subida. Nombre (perfil → `user.nombre`), "Con {asistente.nombre} desde <mes de año>" a partir de `actividad.primera_conversacion` (si no existe, se muestra el email). "Editar" abre una hoja inferior (`EditarPerfilHoja`) con nombre, edad (validada), ciudad, ocupación y bio → `perfilService.guardar`.
- 3 stats en celdas `background` radio 14 con spinner mientras cargan: conversaciones (`actividad.conversaciones`), actividades hechas (`actividad.actividades_completadas`), chequeos (`evaluaciones.length`), con singular/plural.
- Persona de confianza (tarjeta sage): sin dato → "Añadir"; con dato → nombre · teléfono + botones "Llamar" (`tel:`) y "Cambiar". La hoja (`PersonaConfianzaHoja`) valida nombre y teléfono, guarda en `preferencias.personaConfianza` y permite "Quitar" con confirmación.
- Ajustes: toggles "Recordatorio diario" ("Cada noche a las {horaRecordatorio}") y "Notificaciones discretas" con guardado optimista en `preferencias` (revierte si falla). Fila "Privacidad y datos" → Alert explicando qué se guarda en el servidor (Supabase: cuenta, perfil, conversaciones, chequeos, actividades), qué se guarda sólo en el teléfono (sesión, registro de ánimo, preferencias, persona de confianza), que la ficha se comparte desde Registro y que **la app no permite descargar ni borrar conversaciones** por ahora.
- "Cerrar sesión" (outline 48) con confirmación → `logout()`.
- Eliminadas de esta pantalla: actividades pendientes (tienen pantalla propia) y la tarjeta de líneas de emergencia (está en Recursos/Inicio).

## Desviaciones del diseño
- Stat central: el diseño dice "4 días seguidos"; no hay racha en el backend, se muestra "actividades hechas" (dato real).
- Subtexto de "Privacidad y datos": "Qué se guarda y dónde" en lugar de "Descarga o borra tus conversaciones" (el backend no ofrece esos flujos).
- Sin "Bloqueo con huella" (ver [[Decisiones]]).
- Avatar con una pequeña insignia de cámara (22 px) para indicar que se puede cambiar la foto; no está en el diseño.
- Tarjeta de persona de confianza con dato guardado: diseño propio (no existe en la referencia) con botones "Llamar" y "Cambiar".
- Los toggles sólo guardan la preferencia en el dispositivo: aún no se programa ninguna notificación local.

## Revisión producción (2026-10-08)
- **`Hoja` reescrita para teclado**: todo el modal es un `KeyboardAwareScrollView` (react-native-keyboard-controller) con la hoja pegada abajo; el campo enfocado sube por encima del teclado (la hoja corta "se levanta", la alta se desplaza). Sin `KeyboardAvoidingView` (combinado con el ScrollView consciente del teclado compensaría dos veces). `statusBarTranslucent` + `navigationBarTranslucent`, `onRequestClose` (atrás Android), franja mínima de velo bajo la barra de estado, padding inferior con safe area, `accessibilityViewIsModal`, título como `header`. Tocar el velo con teclado abierto sólo lo cierra; sin teclado, cierra la hoja. Tocar zonas vacías de la hoja cierra el teclado (`keyboardShouldPersistTaps="handled"`).
- **Editar perfil**: cadena `returnKeyType="next"` nombre → edad → ciudad → ocupación → bio; `autoComplete`/`textContentType` (`name`, `addressCity`, `jobTitle`), edad `number-pad`. Si la edad no es válida se enfoca el campo con un mensaje concreto. Al fallar el guardado la hoja sigue abierta con lo escrito.
- **Persona de confianza**: nombre (`name`, next) → teléfono (`phone-pad`, `tel`, `done` = guardar), placeholder de ejemplo. Guardar es 100 % local: funciona sin backend.
- **Sin backend**: las preferencias y la persona de confianza se cargan aparte, al instante (antes esperaban a que fallaran perfil y diagnóstico). Stats: spinner mientras carga, "—" si falla (nunca cifras inventadas). Errores con `mensajeDe` (texto corto, sin jerga de Render).
- **Foto**: ya no se pide `requestMediaLibraryPermissionsAsync`. El selector del sistema (Photo Picker Android 13+/PHPicker iOS) no necesita permiso y `READ_EXTERNAL_STORAGE` está en `blockedPermissions` de app.json, así que en Android ≤ 12 la petición se denegaba siempre y la función quedaba rota. Si el sistema niega el acceso igualmente, Alert explicando para qué es + botón **Abrir Ajustes** (`Linking.openSettings`, con `catch`). `accessibilityHint` en el avatar.
- **Llamar**: `tel:` con `catch` → Alert con nombre y número para marcar a mano.
- **Hápticos**: selección en los toggles, éxito al subir la foto.
- Pantallas pequeñas: el subtítulo ("Con Aurora desde septiembre de 2026") y las etiquetas de las stats admiten 2 líneas (en 360 px se cortaban "conversaciones" / "actividades hechas").

## Notificaciones (2026-10-08)
- Los toggles ya **programan notificaciones reales** (deja de valer la desviación "sólo guardan la preferencia"): guardar → `recordatorio.sincronizar(prefs)` (`src/services/recordatorio.ts`). Detalle en [[Notificaciones y voz]] › "A · Hecho".
- **Recordatorio diario**: al activarlo sin permiso se muestra el diálogo del sistema; si se niega, el interruptor queda apagado y un Alert explica por qué (con "Abrir ajustes" si el sistema ya no deja preguntar). Con `no-disponible` (web / Expo Go sin módulo) se guarda la preferencia igualmente.
- **Hora**: el subtítulo "Cada noche a las HH:mm" (o "Cada mañana…" según la hora) es un botón (icono reloj + chevron, `forest`) que abre una `Hoja` "Hora del recordatorio" con `Chip`s: "Por la noche" 19:00–23:00 y "Por la mañana" 07:00–10:00, cada 30 min. Elegir guarda, reprograma y cierra.
- **Notificaciones discretas**: reprograma con título "aliento" y cuerpo neutro, en el canal Android con visibilidad PRIVATE.
- Si el recordatorio está activo y el permiso está pendiente o bloqueado, aparece la tarjeta `PermisoNotificaciones` bajo los ajustes (Permitir / Abrir ajustes); se re-evalúa al volver de Ajustes.
- **Cerrar sesión** cancela los recordatorios (`recordatorio.cancelarTodo()`) antes de `logout()`. Además `App.tsx` los cancela si la sesión se pierde por otra vía (401).

## Adaptación Android/iOS (2026-10-12)
- Avatar 52 en compacto / `escala(56)`.
- Stats: `statsEnFila` calcula si "conversaciones" cabe en la celda con la fuente actual; si no, se apilan como filas (cifra + etiqueta) en lugar de partir la palabra.
- Filas "Privacidad y datos" y "Voz de …": onda Android (`colors.ripple`), opacidad sólo en iOS.
- `Hoja`: centrada con `maxWidth 560` (tablets), entra deslizando, se cierra arrastrando el asa/cabecera hacia abajo (además de ×, velo y atrás), sin rebote del scroll.
- `PermisoNotificaciones`: botones apilados en compacto con fuente > 115 %.
