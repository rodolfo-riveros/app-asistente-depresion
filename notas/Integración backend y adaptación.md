# Integración backend y adaptación Android/iOS

Pedido del usuario (2026-10-12): integrar de una vez con el backend real y que el diseño se adapte a dispositivos Android e iOS.

## Estado del backend (verificado 2026-10-12)
- Repo hermano: `C:\xampp\htdocs\asistente-hamilton-backend` (FastAPI, Render, Supabase). Ver memoria/AGENTS.md del backend.
- Desplegado en `https://asistente-hamilton-backend.onrender.com`: `/salud` 200 (arranque en frío ~50 s), rutas privadas 401 sin token ✔. OpenAPI expone: `/auth/register|login|me`, `/chat/mensaje|historial|sesiones…`, `/evaluaciones`, `/voz/transcribir`, `/perfil`, `/perfil/foto`, `/actividades`, `/actividades/{id}`, `/diagnostico`.
- **Falta en backend:** `POST /voz/sintetizar` (voz en la nube, ver [[Notificaciones y voz]]).
- Los errores CORS vistos en web venían del token simulado / arranque en frío, no de la configuración (`ALLOWED_ORIGINS="*"`).
- Regla: no se crean cuentas de prueba en el Supabase real desde la sesión; el primer login lo hace el usuario.

## Base adaptativa (YA HECHA, sesión principal)
| Qué | Dónde |
|---|---|
| `useLayout()` → `{ ancho, alto, anchoContenido, compacto, bajo, tablet, horizontal, ios, android, escala(n), fontScale }` y `ANCHO_MAXIMO = 560` | `src/hooks/useLayout.ts` |
| `Screen` centra el contenido con `maxWidth: 560` (tablets/horizontal) | `components/ui/Screen.tsx` |
| `Txt` con `maxFontSizeMultiplier` 1.35 (Title 1.2) e `includeFontPadding: false` (Figtree centrada en Android) | `components/ui/Txt.tsx` |
| `TextField` con `maxFontSizeMultiplier` 1.35 | `components/ui/TextField.tsx` |

Tamaños objetivo: Android 360×640 y 360×800 (con barra de 3 botones), iPhone SE 375×667, iPhone 14 390×844, Pro Max 430×932, tablet Android 800×1280. Fuente del sistema al 130 %.

## Reparto de agentes
- **Backend** — `services/*`, `types/*`, `context/*`, `.env*`, backend repo. Contratos, quitar acceso simulado, `/voz/sintetizar`.
- **Adaptación A** — `screens/auth/*`, `screens/inicio/*`, `screens/actividades/*`, `screens/profile/*`, `components/PermisoNotificaciones.tsx`, `components/TabBar.tsx`.
- **Adaptación B** — `screens/chat/ChatScreen.tsx`, `screens/chat/components/*`, `screens/voz/*`, `components/ChatBubble.tsx`, `TypingIndicator.tsx`, `CrisisAlert.tsx`, `LocationPermissionModal.tsx`, `WelcomeModal.tsx`, `PermisoMicrofono.tsx`.
- **Adaptación C** — `screens/registro/*`, `screens/recursos/*`, `screens/chat/ResultScreen.tsx`, `screens/chat/CrisisProtocolScreen.tsx`, `components/ResultCard.tsx`, `components/ErrorBoundary.tsx`.

## Estado
- Backend: ✅ contratos revisados (local = desplegado), acceso simulado apagado, renovación de token, aviso de arranque en frío, `POST /voz/sintetizar` (Azure) con tests. Ver "Backend · Hecho".
- Adaptación A: ✅ auth, inicio, actividades, perfil (+ Hoja), TabBar y PermisoNotificaciones adaptados (ver "Adaptación A · Hecho").
- Adaptación B: ✅ chat, voz y modales adaptados (columna centrada en tablet, burbujas proporcionales, offset del teclado razonado, voz con useLayout, ondas Android). Ver "Adaptación B · Hecho".
- Adaptación C: ✅ registro, recursos, crisis, resultado y ErrorBoundary adaptados (ver "Adaptación C · Hecho").

## Backend · Hecho
El `openapi.json` de Render coincide con el código local (mismas rutas y esquemas) antes de estos cambios. Los cambios del backend **no están desplegados** (sin push).

| Contrato | Estado | Dónde |
|---|---|---|
| `POST /auth/login` `{email, password}` → `{token, user{id,nombre,email}}` | OK · ampliado con `refresh_token`, `expires_in` (opcionales) | backend `routers/auth.py`; app `types/auth.ts` |
| `user.email` puede ser `null` en el backend | corregido en app (se normaliza a `''`) | `services/api.ts` `aUsuario` |
| `POST /auth/register` 201; **202 sin token** si Supabase exige confirmar el correo | corregido en app: axios trataba el 202 como éxito y dejaba una sesión vacía → ahora muestra el `detail` | `services/api.ts` `register` |
| Errores de GoTrue en inglés ("User already registered", "Email not confirmed", rate limit → 502) | corregido en backend: `detail` en español, 429 propio, login sin confirmar → 403 | `routers/auth.py` |
| 422 de Pydantic (`detail` lista, "Value error, …", "String should have at least 6 characters") | corregido en app: se traduce (`missing`, `string_too_short/long`, validadores propios) | `services/api.ts` `mensajeDeValidacion` |
| Token de Supabase caduca en 1 h y no había renovación → logout a mitad de charla | corregido: nuevo `POST /auth/refresh` + la app reintenta una vez tras renovar; si no puede → logout | backend `routers/auth.py`, `db/supabase.py`; app `services/api.ts`, `utils/storage.ts` (`@refresh_token`) |
| 401 cierra sesión | OK; ya no se dispara en `/auth/login|register|refresh` (credenciales malas ≠ sesión caducada) | `services/api.ts` |
| Supabase caído respondía 401 (= logout) | corregido en backend: 503 con `detail` | `deps.py` |
| `GET /auth/me` | ahora se usa: al abrir con sesión guardada se entra sin esperar y se valida en segundo plano (caducado → renovar → si no, login) | `services/auth.ts` `validarSesion`, `context/AuthContext.tsx` |
| `POST /chat/mensaje` `{mensaje, sesion_id?, lat?, lon?}` → `{sesion_id, respuesta, protocolo_crisis_activo, test_completo, ubicacion_solicitada, resultado?}` | OK. La app ya **no** manda `sesion_id` (hilo único v2) | `context/ChatContext.tsx` |
| `sesion_id` ajeno: el backend lo aceptaba (leer/escribir el hilo de otra persona) | corregido en backend: se ignora si no es UUID o es de otro usuario | `routers/chat.py`, `repositorio.sesion_utilizable` |
| Tras cerrar sesión el chat conservaba mensajes/hilo de la persona anterior | corregido en app (reset al perder la sesión) | `context/ChatContext.tsx` |
| `resultado` `{score, nivel, interpretacion, recomendaciones[], fecha ISO, sesion_id}`; niveles "Sin depresión / Depresión moderada / Depresión severa" | OK (el SVM no produce "leve") | — |
| `GET /chat/historial?limite` (≤500) → `[{rol, contenido, creado_en}]` | OK (+ reintento si falla la red) | — |
| `POST /voz/transcribir` multipart `audio` (m4a nativo, webm web) → `{texto}` | OK; en web la extensión sale del tipo real del blob (Safari graba mp4) | `services/api.ts` |
| `GET/PUT /perfil`, `POST /perfil/foto` (campo `foto`, jpg/png/webp ≤ 5 MB) | OK; **vaciar un campo no lo borraba** → corregido en ambos lados (`null`/`''` borra; el nombre nunca) · webp y tipo real en web | backend `routers/perfil.py`, `repositorio.actualizar_perfil`; app `services/perfil.ts` |
| `/actividades` (GET `estado`, POST 201, PATCH, DELETE 204) | OK | — |
| `GET /diagnostico` | OK (campos opcionales ya normalizados en `services/diagnostico.ts`) | — |
| Reintento de red (`conReintento`) | **nunca se activaba** (buscaba textos que ya no existen) → corregido: sólo fallos sin respuesta, nunca timeouts ni chat/registro (duplicarían) | `services/api.ts` |
| Arranque en frío de Render (~50 s) con timeout de 30 s | corregido: `GET /salud` al abrir la app; sin respuesta en 10 min el timeout sube a 75 s; chat 60 s | `services/api.ts`, `AuthContext` |
| `POST /voz/sintetizar` | **nuevo** (ver abajo) | backend `app/voz/tts.py`, `routers/voz.py` |

**Acceso simulado**: `EXPO_PUBLIC_AUTH_SIMULADO=false` en `.env` (el mecanismo sigue en `services/auth.ts`). `.env` apunta a Render. La sesión simulada guardada se descarta sola al abrir.

**Aviso "servidor despertando" (pendiente de pantallas)**: `useAuth().servidorDespertando` pasa a `true` cuando una petición con el servidor frío lleva > 4 s; texto listo en `MENSAJE_DESPERTANDO` (`services/api.ts`, sin hablar de servidores). Falta pintarlo: Login/Crear cuenta bajo el botón mientras `cargando && servidorDespertando`, y en el chat junto al indicador de escritura. Opcional: `EditarPerfilHoja` puede mandar `''` para vaciar campos (hoy manda `undefined`, que el servicio ya convierte en `null`).

**Voz en la nube**: `POST /voz/sintetizar` (Bearer) `{texto ≤ 1500, voz?: "es-XX-…Neural", ritmo?: "pausada"|"normal"}` → `200 audio/mpeg` (MP3 24 kHz 48 kbps). SSML con `es-PE-CamilaNeural`, `pausada` = rate −8 % / pitch −2 %, `mstts:silence` 250 ms entre oraciones, texto escapado. Timeout a Azure 7 s. Errores: 413 largo, 422 voz/ritmo, 503 sin configurar, 502/503/504 fallos de Azure (nunca 401, que cerraría la sesión). La app no pide la nube con textos > 1500. `EXPO_PUBLIC_TTS_NUBE=false` hasta que el backend desplegado tenga la clave: con `true` y sin clave, cada respuesta haría una petición inútil (503) antes de hablar con la voz del teléfono.

**Verificado**: backend `pytest` 56 ✔ (36 nuevos: 20 de TTS + 16 de auth/sesión/perfil, sin red) y `import app.main` ✔ (.venv Python 3.12). App `tsc` 0, `eslint` 0 errores (1 aviso previo de `axios.create`), `prettier` aplicado. No se probó contra el Supabase real (no se crean cuentas desde la sesión).

**Pasos del usuario**
1. Backend: revisar y hacer commit/push → Render redespliega. `GET /salud` debe mostrar `"supabase": true`.
2. Voz neuronal (opcional): Azure Portal → crear recurso **Speech** (capa F0) → copiar *Key 1* y *Region*. En Render → Environment: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` (y `TTS_VOZ` si se quiere otra voz). Tras redesplegar, `/salud` → `"tts": true`. Entonces en la app `EXPO_PUBLIC_TTS_NUBE=true` y `npx expo start -c`.
3. Supabase → Authentication → Email: desactivar "Confirm email" (si no, el registro pide confirmar el correo antes de entrar; la app ya lo explica).
4. App: `npx expo start -c` (cambió `.env`). Primer registro/login con una cuenta real; la primera petición del día puede tardar ~1 min.
5. Las sesiones iniciadas **antes** de desplegar no tienen `refresh_token`: caducan a la hora como antes; desde el siguiente login se renuevan solas.

## Adaptación C · Hecho
- **Criterio común "apilar"**: `anchoContenido / min(fontScale, 1.35) < 380` → los pares de botones (Ver especialistas / Compartir, Llamar / Copiar, teléfono / Cómo llegar) pasan a columna a ancho completo. Se apilan en 360 px y en cualquier teléfono con fuente al 130 %; en 390–430 px con fuente normal y en tablet quedan en fila como el diseño. En columna se quita `grow` (con `flexBasis: 0` el botón colapsaría a alto 0).
- **Gráficas (`registro/components/Graficas.tsx`)**: ancho medido con `onLayout`. Barras de la semana con hueco proporcional (4–12 px) y ancho máx. 40 px (en tablet ya no son bloques); zona de barras de alto fijo y letras debajo en flujo (antes el contenedor medía 84 px fijos y con fuente al 130 % las letras se salían). Evolución: si la columna es más estrecha que "12 oct" con la fuente actual, la fecha se parte en dos líneas (día / mes) en vez de cortarse con "…"; en ancho efectivo < 340 se muestran 6 evaluaciones en vez de 8.
- **Cifra grande del puntaje** (Registro y `ResultCard`): `maxFontSizeMultiplier 1.2` y fila con `flexWrap` (la frase del nivel baja de línea si no cabe).
- **Recursos**: filas, tarjeta destacada y ayuda profesional con `Pulsable` local: `android_ripple` (salvia clara / `dividerSoft` / `peachSoft` en la de crisis) recortado con `overflow: hidden` en Android y opacidad 0.7 sólo en iOS. Ilustración con `viewBox 0 0 110 110` y tamaño `escala(compacto ? 92 : 110)`, anclada abajo (la colina toca el borde aunque la tarjeta crezca con fuente grande). Chips: `paddingVertical` para que no se recorte el borde, `alwaysBounceHorizontal={false}` (iOS) y `overScrollMode="never"` (Android). Buscador con `maxFontSizeMultiplier`, `includeFontPadding: false` y padding vertical por sistema.
- **GuiaModal**: cabecera y contenido en columna centrada `maxWidth: ANCHO_MAXIMO` (tablet / iPad); título con multiplicador 1.2. Safe areas sin cambios (iOS `pageSheet`: abajo/lados; Android pantalla completa translúcida: los 4 bordes).
- **Respiracion478**: diámetro `tablet ? 232 : escala(compacto ? 172 : 200)`; textos del círculo con multiplicador 1.2 (cifra 36 px en compacto).
- **Crisis**: "Llamar al 113" pasa a botón `lg` a ancho completo cuando se apila; cabecera "Centros…" con `flexBasis: 160` (el botón de ubicación baja de línea en vez de estrujar el título); filas dirección/horario con icono arriba para direcciones de varias líneas.
- **ErrorBoundary**: SafeAreaView 4 bordes + ScrollView centrado, columna `maxWidth 480`, botón "Llamar al 113" (la etiqueta larga no cabía en 360 px con fuente grande) con la línea y opción en texto debajo.
- Verificado: `tsc` 0, `eslint` 0, `prettier` limpio en mis archivos. Sin probar en dispositivo (panel compartido).
- **Pendiente compartido (fuera de mis archivos)**: `Button` tiene alto fijo y la etiqueta sin `numberOfLines`/`flexShrink` → cualquier etiqueta larga desborda la píldora con fuente grande (convendría `minHeight` + `flexShrink: 1` + `align center`). `Chip` mide 40 px de alto (< 44 de toque). `HelpButton variant="bar"` ("¿Necesitas ayuda ya? Línea 113, opción 5") no cabe en 360 px con fuente al 130 %. No hay token de color para ondas (`ripple`); se reutilizan `sageLight`/`dividerSoft`/`peachSoft`.

## Adaptación B · Hecho
- **Chat** (`ChatScreen.tsx`): lista y barra de entrada en columna `COLUMNA` (`width 100%`, `maxWidth ANCHO_MAXIMO`, centrada); el fondo, el borde superior de la barra y el área de scroll siguen a pantalla completa. Tarjeta del chequeo en la misma columna.
- **Burbujas**: `ChatBubble` acepta `anchoMaximo`; la pantalla lo calcula como `min(440, (anchoContenido − 32) × 0,78)` → 253 px en 360, 310 en 430, 412 en tablet (techo de lectura ≈ 60 caracteres). `React.memo`, `textBreakStrategy="highQuality"` + guiones en Android.
- **Cabecera** (`ChatHeader`): 72 px fijos; nombre y estado en 1 línea con `maxFontSizeMultiplier 1.2` y `minWidth: 0`; avatar 36 px y paddings menores en `compacto`; etiqueta accesible única.
- **Teclado**: se mantiene `keyboardVerticalOffset = −max(insets.bottom, 8)` y ahora está razonado en el código: el KAV de keyboard-controller acaba en el borde inferior de la pantalla y `altoTeclado` se mide desde ese borde en ambos sistemas (iOS incluye el home indicator; Android incluye la barra de gestos/3 botones porque `KeyboardProvider` va con `navigationBarTranslucent`). Padding = teclado − holgura; la barra reserva esa holgura → píldora a 10 px del teclado en todos los casos, sin hueco doble. `keyboardDismissMode` `interactive` en iOS, `on-drag` en Android. `TextInput` con `maxFontSizeMultiplier 1.35`.
- **Voz** (`VozScreen.tsx`): `useWindowDimensions` sustituido por `useLayout` + safe area. Se decide por alto útil: `mini = bajo || útil < 620` (SE, 360×640) → orbe 62 %; `compacta = útil < 740 || (fontScale ≥ 1,15 && útil < 820)` (360×800 con 3 botones, iPhone 14 al 130 %) → orbe 80 %. Orbe y controles × `escala()` (240 px en 360, 286 en tablet). En tablet el bloque central se centra en vertical (la columna ya la centra `Screen`). Controles fuera del scroll, centrados, etiquetas 1 línea ×1.2. Cabecera con textos ×1.2.
- **Modales**: `CrisisAlert` y `CentrosSheet` con `maxWidth ANCHO_MAXIMO` centrados y safe areas laterales; `LocationPermissionModal`/`WelcomeModal` con insets laterales (ya tenían `maxWidth 360`). Ubicación apila los botones (principal arriba) en < 400 px con fuente ≥ 115 %. `CrisisAlert` conserva sus etiquetas (Button ya admite 2 líneas). Todos con `onRequestClose` (atrás de Android).
- **Toques**: `android_ripple` con los tokens `colors.ripple` (superficies claras) y `colors.rippleOnDark` (enviar sobre tinta, controles de voz) (mic/enviar del chat, filas de crisis, teléfono de centros, controles de voz con onda circular `borderless`); la opacidad al pulsar queda sólo en iOS. Sin sombras nuevas, sin hex, sin `fontWeight`.
- `tsc` 0, `eslint` 0, `prettier` limpio. Sin probar en dispositivo (panel compartido).
- **Barra de navegación Android en Voz (pendiente, requiere paquete)**: con edge-to-edge la barra es transparente y el estilo de sus iconos sigue al tema claro de la app (iconos oscuros). Con 3 botones el sistema pinta un velo claro semitransparente (contraste forzado) → legible pero se ve una franja clara sobre `voiceBg`; con gestos, la mayoría de launchers adaptan el color de la píldora al fondo. Solución recomendada: `npx expo install expo-navigation-bar` y en Voz, con `useFocusEffect`, `NavigationBar.setStyle('light')` al entrar y `'dark'` al salir. **No se instaló** (pedirlo al usuario).
- **Pendiente compartido**: `IconButton`/`HelpButton compact` siguen sólo con opacidad (sin onda en Android).

## Adaptación A · Hecho
- **Bienvenida**: ilustración `AmanecerIlustracion` acepta `height` → 96 px en `bajo` (72 con fuente > 110 %), 140 en `compacto`, `escala(184)` en el resto. En compacto: huecos 14, padding 20, titular 28–30, filas con IconTile 36 y texto 14, bloque final con gap 8. Estimado en 375×667 con fuente normal: cabe sin desplazar; con fuente 130 % se desplaza (`Screen scroll`).
- **Login / Crear cuenta**: en compacto, huecos 16, padding superior 8, LogoMark 40, titular 27. Login cabe en 375×667 sin desplazar; Crear cuenta se desplaza (formulario largo) con el campo enfocado sobre el teclado.
- **Inicio**: tarjetas Escribir/Hablar con `minHeight` (140 bajo / 152 compacto / `escala(168)`), crecen con fuente grande. Check-in de ánimo: en compacto padding 12, gap 4, orbe 24; "Muy mal"/"Muy bien" parten en 2 líneas, "Regular" (una palabra) usa `adjustsFontSizeToFit` + `minimumFontScale 0.75`; celdas alineadas arriba para que los orbes no se desalineen.
- **Toques nativos**: nuevo `screens/inicio/components/Tocable.tsx` — superficie tocable con `android_ripple` (`colors.ripple` / `rippleOnDark`) recortada por una caja exterior `overflow: 'hidden'` (en RN Android la onda de fondo usa máscara rectangular y no respeta `borderRadius`), opacidad sólo en iOS/web. Usado en Escribir/Hablar, "Tu registro semanal", tarjetas "Para hoy" y estado vacío. Onda también en filas de Perfil (Privacidad, Voz), en el check de Actividades (circular `borderless`) y en las pestañas.
- **TabBar**: fila fija de 54 px + 6 arriba; abajo `inset − 8` en iOS (home indicator → ≈ 88 px total, cerca de la nativa 49 + 34), `inset + 6` en Android (gestos o 3 botones, edge-to-edge) y 12 sin inset. Pestañas centradas con `maxWidth ANCHO_MAXIMO` (tablets), insets laterales, `tabLongPress`, etiquetas de una línea que se encogen (`minimumFontScale 0.8`, `maxFontSizeMultiplier 1.25`).
- **Hoja** (`profile/components/Hoja.tsx`): ancho máximo 560 centrada (tablets), entrada deslizando desde abajo, **arrastrar el asa/cabecera hacia abajo cierra** (PanResponder: > 90 px o velocidad > 0,9), `bounces={false}`/`overScrollMode="never"` para que el arrastre no compita con el scroll, `keyboardDismissMode` interactive (iOS) / on-drag (Android). Se mantiene: teclado con KeyboardAwareScrollView, `onRequestClose`, `statusBarTranslucent` + `navigationBarTranslucent`, safe area inferior.
- **Perfil**: avatar 52 (compacto) / `escala(56)`. Stats: si "conversaciones" no cabe en la celda con la fuente actual (`statsEnFila`: ancho de celda vs 86 px × fontScale), se apilan como filas cifra + etiqueta en vez de partir la palabra.
- **Actividades**: filtros con `flexWrap` (con fuente 130 % en 360 px no caben las 3 píldoras en fila).
- **PermisoNotificaciones**: en compacto con fuente > 115 % los botones se apilan (principal arriba).
- StatusBar: la pone `Screen` (oscura sobre crema) en todas estas pantallas. Sin sombras, sin hex, sin `fontWeight`.
- `tsc` 0, `eslint` 0, `prettier` limpio en los archivos de A. Sin probar en dispositivo (panel compartido).
- **Pendiente compartido** (no editado, es `components/ui`): `Card onPress` sigue sólo con opacidad; si se quiere onda, conviene llevar el patrón de `Tocable` (caja con `overflow: 'hidden'` + `android_ripple`) a `Card` y retirar `Tocable`. `Chip` tampoco tiene onda.
- **Riesgo a probar en dispositivo**: el arrastre de la Hoja cuando su contenido es más alto que la pantalla (Voz con muchas voces): el ScrollView puede quedarse el gesto; entonces se cierra con ×, velo o atrás.
