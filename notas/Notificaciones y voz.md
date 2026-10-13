# Notificaciones y voz

Pedido del usuario (2026-10-08): que el "Recordatorio diario" funcione de verdad (la asistente pregunta cómo te sientes), pedir permiso de notificaciones del móvil, y una voz **femenina, calmada, que dé tranquilidad**. Decisiones y proveedores en [[Decisiones]].

## Base ya preparada (sesión principal)
- `expo-notifications` instalado; plugin en `app.json` con `icon: assets/notification-icon.png` (silueta blanca del isotipo, Android), `color: #2F4A3E`, `defaultChannel: recordatorio`. Permisos Android: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`.
- `utils/preferencias.ts`: además de `recordatorioDiario`, `horaRecordatorio` ('HH:mm'), `notificacionesDiscretas`, ahora `vozId: string | null` y `vozRitmo: 'pausada' | 'normal'`.

## A · Notificaciones (agente "notificaciones")
Archivos: `src/services/recordatorio.ts` (nuevo), `src/hooks/usePermisoNotificaciones.ts` (nuevo), `src/components/PermisoNotificaciones.tsx` (nuevo), `App.tsx` (configurar handler + abrir pantalla al tocar), `src/navigation/RootNavigator.tsx` si hace falta, `src/screens/profile/ProfileScreen.tsx` (toggles + hora), `src/screens/auth/RegisterScreen.tsx` (toggle del registro), `src/screens/inicio/InicioScreen.tsx` (aviso si el recordatorio está activo pero falta permiso).
- Notificación local diaria a `horaRecordatorio`, mensajes calmados que varían, con `notificacionesDiscretas` → sin texto sensible.
- Explicar antes de pedir permiso; si está bloqueado → Ajustes.
- Tocar la notificación abre Inicio (check-in de ánimo).
- Reprogramar al abrir la app y al cambiar preferencias; cancelar al cerrar sesión.

## B · Voz (agente "voz")
Archivos: `src/services/voz.ts`, `src/screens/profile/components/VozAjuste.tsx` (nuevo, autónomo: fila + hoja con selector y "Probar"), `src/screens/voz/*` sólo si hace falta para la nueva API. **No** edita `ProfileScreen.tsx` (la sesión principal monta `VozAjuste` cuando ambos terminen).
- Elegir por defecto la mejor voz **femenina** en español del teléfono; ritmo pausado y tono suave.
- Selector con las voces en español disponibles, "Probar" con una frase calmada.
- Preparar motor en la nube (`POST /voz/sintetizar` del backend) tras `EXPO_PUBLIC_TTS_NUBE`, con caída automática a la voz del teléfono. Apagado por defecto hasta que exista el endpoint.

## Estado
- A: ✅ recordatorio local real (14 días programados con mensajes variados en la voz de la asistente, modo discreto, canal Android propio), permiso explicado (tarjeta + hook), hora elegible en Perfil, tocar → Inicio, cancelado al cerrar sesión. Ver "A · Hecho".
- B: ✅ voz femenina automática + ritmo calmado (`services/voz.ts`), selector `VozAjuste` (montado en Perfil), motor en la nube preparado y apagado (`EXPO_PUBLIC_TTS_NUBE=false`).

## A · Hecho
- **`src/services/recordatorio.ts`** (único archivo que toca `expo-notifications`, cargado con `import()` diferido; en web devuelve `null` y si el módulo falla al importarse —Expo Go Android— todo degrada sin avisos):
  - `configurar()`: handler (banner + lista, **sin sonido** con la app abierta, sin badge) y dos canales Android: `recordatorio` ("Recordatorio diario", importancia DEFAULT, vibración corta `[0,120]`) y `recordatorio-discreto` (igual + `lockscreenVisibility: PRIVATE`). Son dos porque Android no deja cambiar la visibilidad de un canal ya creado.
  - `sincronizar(prefs?)`: serializado (cola), cancela sólo los programados con prefijo `aliento-recordatorio-` y, si `recordatorioDiario` y hay permiso, programa los próximos **14 días** (trigger `DATE`, hoy si la hora aún no pasó) a `horaRecordatorio`. Mensaje distinto cada día (índice estable por fecha) según franja mañana/tarde/noche, firmado por `asistente.nombre` (título) — calmados, sin culpa ni urgencia. Discreto: título `app.nombre` ("aliento") y cuerpo "Tienes un momento para ti". `data: { abrir: 'checkin' }`.
  - `cancelarTodo()`: quita los programados y los ya mostrados de la app. `alTocar(cb)`: respuesta en frío (`getLastNotificationResponse` + `clear…`) y listener; sólo acción por defecto con `abrir: 'checkin'`.
  - Helpers `franjaDe(hora)` / `cadaFranja(hora)` ("cada noche").
- **`hooks/usePermisoNotificaciones.ts`**: `{ estado: cargando|pendiente|concedido|bloqueado|no-disponible, pedir(), abrirAjustes(), refrescar() }`; re-consulta al volver a la app. `pedir()` crea el canal antes (Android 13 lo exige).
- **`components/PermisoNotificaciones.tsx`**: tarjeta (blanca o `sage`) "Para que {asistente} te pregunte cómo estás cada noche…", botón Permitir / Abrir ajustes y "Ahora no" opcional.
- **`App.tsx`**: `configurar()` al cargar el módulo; `GestorRecordatorio` (dentro de `NavigationContainer`) sincroniza al haber sesión y en cada vuelta a primer plano, cancela al perder la sesión (incluye 401) y, al tocar el aviso, navega a `MainApp › InicioTab` con `navigationRef` cuando la navegación está lista y hay sesión (cubre arranque en frío con sesión restaurándose). `RootNavigator` sin cambios.
- **Registro**: tras crear la cuenta con el toggle activo → diálogo del sistema + `sincronizar` (sin bloquear la entrada).
- **Perfil**: toggles guardan + `sincronizar`. Activar el recordatorio sin permiso pide el diálogo; si se niega queda apagado con un Alert que explica (y "Abrir ajustes" si está bloqueado). Subtítulo "Cada noche a las 21:00" tocable (icono reloj, verde) → hoja con 19:00–23:00 y 07:00–10:00 cada 30 min (`Chip`). Si el recordatorio está activo y el permiso está pendiente/bloqueado, tarjeta `PermisoNotificaciones` bajo los ajustes. "Cerrar sesión" llama `cancelarTodo()` antes de `logout()`.
- **Inicio**: aviso `sage` descartable antes del botón de ayuda si el recordatorio está activo y falta permiso; "Ahora no" → `@aviso_notif_cerrado = '1'`.
- Cómo probar: build de desarrollo / APK `preview` (o Expo Go iOS). Elegir en Perfil una hora 1–2 min más tarde no es posible con la lista (pasos de 30 min): para probar rápido, poner temporalmente `horaRecordatorio` cercana o revisar con `getAllScheduledNotificationsAsync` (14 entradas `aliento-recordatorio-N`).
- Limitaciones: web sin notificaciones (estado `no-disponible`, no se muestra tarjeta, la preferencia se guarda igual). Expo Go Android (SDK 53+) puede fallar al importar `expo-notifications` → sin recordatorio, la app no se rompe. Si la persona no abre la app en 14 días, dejan de llegar hasta que la abra (decisión deliberada: no insistir a quien no usa la app).

## B · Hecho
- **`src/services/voz.ts`**
  - Voz automática = mejor voz **femenina** en español del teléfono. expo-speech no da el género: heurística por nombre/identificador (aproximada, documentada en el código). iOS/web por nombre (Paulina, Mónica, Marisol, Angélica, Isabela, Soledad, Francisca, Camila, Dalia, Elvira, Helena, Sabina… = femeninas; Jorge, Juan, Diego, Carlos, Pablo, Raúl… = masculinas). Google TTS: `es-us-x-sfb/esc/esf` y `es-es-x-eea/eec` femeninas, `esd`/`eed`/`eef` masculinas; marcas `#female`/`#male` y Samsung `SMTf`/`SMTm`. Desconocidas → `femenina: null`.
  - Orden: femenina (+100, desconocida +30) > Premium/Enhanced > acento (es-PE > es-MX/es-US/es-419 > otros latinos > es-ES). Penaliza voces Eloquence/novedad de Apple y, levemente, las "network" (fallan sin conexión).
  - `vozId` de preferencias manda; si ya no está instalada, vuelve a la automática.
  - Ritmo por plataforma: Android pausada 0.88 / normal 0.98; iOS 0.93 / 1.0 (en iOS bajar el rate se nota más); pitch 1.0 (iOS 1.02). Tramos por oraciones con **pausa de 280 ms** entre ellos.
  - API nueva: `listarVocesEspanol()` → `{ id, nombre, idioma, pais, calidad: 'alta'|'estándar', femenina: boolean|null, enLinea }[]` ordenadas (la primera = recomendada), `vozRecomendada()`, `probarVoz(id|null, ritmo, onDone?)` con "Hola, soy {asistente.nombre}. Estoy aquí para escucharte, sin prisa.", `refrescarPreferenciasVoz()` (invalida caché de catálogo y de preferencias). `voz.hablar(texto, onDone)` / `voz.callar()` mantienen la firma; `onDone` se llama una vez (fin, error o `callar`). `callar` corta teléfono **y** nube.
  - Android a veces devuelve `[]` voces mientras arranca el motor: no se cachea un catálogo vacío.
- **Motor en la nube** (apagado): con `EXPO_PUBLIC_TTS_NUBE=true`, `hablar` pide el audio entero a `api.sintetizarVoz` (axios `arraybuffer`, límite 8 s), lo convierte a data URI `data:audio/mpeg;base64,…` y lo reproduce con `createAudioPlayer` de expo-audio (sin archivos temporales: `expo-file-system` no es dependencia directa). Si la petición falla, tarda > 8 s, el reproductor reporta `error` o no carga en 8 s → voz del teléfono. Si se corta a mitad, se da por terminada. Riesgo a verificar en iOS: AVPlayer con data URI; si no carga, cae al teléfono (alternativa futura: instalar `expo-file-system` y escribir a caché).
- **`.env` / `.env.example`**: `EXPO_PUBLIC_TTS_NUBE=false`.
- **`src/screens/profile/components/VozAjuste.tsx`** (sin props): fila "Voz de {asistente.nombre}" con subtítulo ("Automática · femenina" o "{nombre} · {país}") + chevron → `Hoja` con chips Pausada/Normal, "Automática (recomendada)" y la lista de voces (recomendada marcada, la en uso con borde y check), cada una con Probar/Detener y Usar. Guarda en `preferencias` + `refrescarPreferenciasVoz()`. La prueba se corta al cerrar, al cambiar ritmo, al desmontar y al ir a segundo plano; al volver de Ajustes relee el catálogo. Estado vacío con instrucciones por plataforma. **Pendiente (sesión principal):** montarla en la tarjeta de ajustes de `ProfileScreen` (`<VozAjuste />` + `<Divider />`).

### Contrato para el backend: `POST /voz/sintetizar`
- Auth: `Authorization: Bearer <access_token>` (como el resto). La clave del proveedor (Azure AI Speech recomendado, ver [[Decisiones]]) **sólo** en el backend.
- Request JSON: `{ "texto": string, "voz"?: string, "ritmo"?: "pausada" | "normal" }`. La app manda el texto ya limpio de markdown/emojis (puede superar 1000 caracteres; limitar en servidor, p. ej. 3000). `voz` hoy no se envía (el backend elige la voz por defecto, p. ej. `es-PE-CamilaNeural`); queda para el futuro.
- Respuesta 200: cuerpo binario `Content-Type: audio/mpeg` (MP3 mono 24–48 kbps). Responder en < 8 s o la app usa la voz del teléfono.
- Sugerencia SSML: `<prosody rate="-10%" pitch="-2%">` para `pausada`, `rate="0%"` para `normal`; estilo calmado/gentle si la voz lo admite.
- Errores: 4xx/5xx con `{ "detail": "…" }`. 401 → la app cierra sesión (interceptor existente).
