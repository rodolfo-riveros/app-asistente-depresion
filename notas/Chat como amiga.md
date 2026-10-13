# Chat como amiga (v4)

Pedido del usuario (2026-10-12): que el chat no se sienta a test; espontáneo, como una amiga o una psicóloga que escucha; que las preguntas del test salgan a medida que la persona se abre; que recomiende actividades y recursos de la app; que ayude a planificar con apps del móvil (Spotify…); y que **pida la ubicación** para recomendar siempre los centros de salud mental más cercanos.

## Decisiones del usuario
- **Ubicación: al crear la cuenta.** Después se adjunta sola (lat/lon) a cada mensaje si hay permiso.
- **Sin clave de Google Places**: centros de Cusco (lista local) + botón "Buscar en Google Maps" alrededor de la ubicación cuando la persona está en otro lugar.
- **Botones en el chat**: música (Spotify / YouTube Music), mapas y llamadas, recursos de la app, actividades/recordatorios.
- **Test muy espaciado**: primero conversar y escuchar; como máximo una pregunta del test cuando encaje con lo que cuenta; nunca dos seguidas; el test puede completarse en varios días.
- Ítems y escalas de Hamilton y protocolo de crisis **no cambian** (sustentan la tesis; ver system_prompt). Sólo cambian tono y ritmo.

## Contrato app ↔ backend
`POST /chat/mensaje` — petición igual (`{mensaje, lat?, lon?}`); la app manda lat/lon en **cada** mensaje cuando tiene permiso. Respuesta: lo de siempre **+ `acciones: Accion[]`** (siempre presente, puede ser `[]`).

`GET /chat/historial` — cada mensaje **+ `acciones?: Accion[]`** (de la columna nueva `mensajes.acciones jsonb`; `null` → `[]`).

`Accion` (discriminada por `tipo`):
```ts
type Accion =
  | { tipo: 'musica'; titulo: string; busqueda: string; spotify_url: string; youtube_music_url: string }
  | { tipo: 'recurso'; titulo: string; recurso_id: RecursoId }
  | { tipo: 'centro'; titulo: string; direccion?: string | null; telefono?: string | null; maps_url: string; distancia_km?: number | null }
  | { tipo: 'buscar_mapa'; titulo: string; maps_url: string }
  | { tipo: 'llamar'; titulo: string; telefono: string }
  | { tipo: 'actividad'; titulo: string; actividad_id?: string | null };

type RecursoId =
  | 'guia-depresion' | 'respiracion-478' | 'escaneo-corporal' | 'tres-cosas-buenas'
  | 'grounding-54321' | 'higiene-sueno' | 'activacion-conductual';
```
- `spotify_url` = `https://open.spotify.com/search/<q>` (enlace universal: abre la app de Spotify si está instalada). `youtube_music_url` = `https://music.youtube.com/search?q=<q>`.
- `buscar_mapa.maps_url` = `https://www.google.com/maps/search/?api=1&query=centro+de+salud+mental` + cerca de `lat,lon` (p. ej. `https://www.google.com/maps/search/centro+de+salud+mental/@<lat>,<lon>,14z`).
- Los ids de recurso son los de `src/screens/recursos/contenido.ts` (app).

Migración: `supabase/schema_v4.sql` (`alter table public.mensajes add column if not exists acciones jsonb;`) y añadida al final de `supabase/instalar_todo.sql`. El backend debe funcionar aunque la columna aún no exista (reintenta sin `acciones`).

## Reparto
- **Backend** (`asistente-hamilton-backend`): prompt, tools, `acciones`, ubicación en contexto, migración v4, tests.
- **App** (`app-asistente-depresion`): tipos, ChatContext, ubicación tras registro + envío automático, botones de acción en el chat, abrir recurso en Recursos.

## Estado
- Backend: ✅ prompt amiga + test muy espaciado, `recomendar_recurso`, `acciones` en `/chat/mensaje` e historial, ubicación en el system prompt, `schema_v4.sql` (2026-10-12) — falta ejecutar schema_v4 en Supabase
- App: ✅ tipos + ChatContext (acciones, lat/lon automáticos), ubicación tras el registro (hoja en Inicio + fila en Perfil), botones de acción en el chat, abrir recurso en Recursos (2026-10-12)

## App · Hecho
- **Tipos** (`src/types/chat.ts`): `Accion` y `RecursoId` tal cual el contrato; `ChatMessage.acciones?`. `ChatMessageResponse.acciones?` y `MensajeGuardado.acciones?` (opcionales, admiten `null`).
- **Tolerancia** (`src/utils/acciones.ts` → `normalizarAcciones`): sin `acciones`, `null`, tipo desconocido, `recurso_id` que no existe o campos obligatorios vacíos → se descartan sin romper nada. `ChatContext` lo aplica a mensajes nuevos y al restaurar `/chat/historial`.
- **Ubicación** (`src/services/ubicacion.ts`): `leerPermisoUbicacion`, `pedirPermisoUbicacion`, `ubicacionActual()` (no pide permiso; última conocida primero, si no GPS con tope 12 s; caché 10 min y búsqueda compartida) y `ubicacionRapida(1500)`. `ChatContext.sendMessage` adjunta lat/lon en cada mensaje si hay permiso, esperando como mucho ~1,5 s (si el GPS tarda, el mensaje sale sin coordenadas y la posición queda en caché para el siguiente). Se olvida al cerrar sesión.
- **Permiso**: `src/hooks/usePermisoUbicacion.ts` (cargando/pendiente/concedido/bloqueado, `pedir`, `abrirAjustes`, re-consulta al volver a la app) + `src/components/PermisoUbicacion.tsx` (tarjeta y `PermisoUbicacionHoja`: "Para recomendarte los centros de salud mental más cercanos a ti…", Permitir / Ahora no / Abrir ajustes).
- **Cuándo se pregunta**: hoja en Inicio una vez por persona (`@ubicacion_preguntada` = lista de ids de usuario): tras crear la cuenta (la app entra sola en Inicio) y a quien inicie sesión sin haberla concedido nunca. Si ya está concedida, se anota sin mostrar nada. Perfil › Ajustes tiene la fila "Ubicación" con estado y Permitir / Abrir ajustes.
- **`ubicacion_solicitada`** se mantiene: si el backend la pide y falta el permiso → `PermisoUbicacionHoja` (sustituye a `LocationPermissionModal`, borrado); si el permiso ya está, se comparte sola. "Buscar centros cercanos" del aviso de crisis va directo a los centros si hay permiso.
- **Botones** (`src/screens/chat/components/AccionesMensaje.tsx`, bajo la burbuja de la asistente en `ChatScreen`): `musica` → "Escuchar en Spotify" + "YouTube Music"; `recurso` → `MainApp › RecursosTab { abrir }` y `RecursosScreen` abre su `GuiaModal` y limpia el parámetro; `centro` → tarjeta con dirección · distancia, "Cómo llegar" y "Llamar" si hay teléfono; `buscar_mapa` → "Buscar en Google Maps"; `llamar` → `llamar()` de `recursos/enlaces.ts` (si falla, ofrece copiar el número); `actividad` → "Ver en Actividades". Enlaces con `openURL` + `catch` → Alert amable.
- Textos de privacidad (`contenidoLegal.ts`) y del permiso iOS (`app.json`) actualizados: la ubicación ya no se usa "solo cuando la pides", sino con cada mensaje si hay permiso. **Requiere nuevo build nativo** para el texto de iOS.
- Verificado: `tsc`, `eslint src`, `prettier`, `npx expo export --platform ios`. Falta probar en dispositivo con el backend v4.

## Backend · Hecho
- **Prompt** (`app/prompts/system_prompt.py`): nueva sección "Cómo conversas": amiga / psicóloga que escucha, escucha reflexiva, validar antes de proponer, preguntas abiertas de una en una, seguir el hilo de la persona, 2–4 frases, sin listas, sin consejos no pedidos. **Test muy espaciado**: nunca en los primeros intercambios; como máximo un ítem cuando conecte con lo que cuenta; nunca dos seguidos; nada de ítems si se está desahogando; si ya contó algo que responde un ítem se registra sin preguntar; puede completarse en varios días y no se anuncia el progreso. Las frases de los ítems quedan como referencia "adáptalas al hilo". Guía para `recomendar_recurso` (cuándo usar cada uno de los 7), `recomendar_musica`, `agendar_actividad` y `buscar_centros_cercanos` también fuera de crisis, usando la ubicación del contexto sin pedirla otra vez (sin ubicación: sugerir activarla en Perfil o dar los centros generales de Cusco). "No pegues URLs: la app pone botones". **Sin cambios**: los 17 ítems, sus escalas y el protocolo de crisis (sólo una línea en el paso 5: si ya hay ubicación, no llamar a `solicitar_ubicacion`).
- **Ubicación**: ya no se pega `[Ubicación recibida…]` al mensaje. El system prompt del turno lleva un bloque `UBICACIÓN` ("Ubicación actual disponible: lat, lon; aprox. en Cusco / fuera de Cusco" — radio 25 km desde la Plaza de Armas — o "No hay ubicación en este turno"). `buscar_centros_cercanos` (lat/lon ahora opcionales) usa las del turno si el modelo no las pasa. Lo guardado en `mensajes` y lo que devuelve `/chat/historial` es el texto limpio.
- **Acciones** (`app/chat/acciones.py`, contrato de esta nota): `recomendar_musica` → `musica`; `recomendar_recurso` (nueva, enum de los 7 `RecursoId`, títulos de `contenido.ts`) → `recurso`; `buscar_centros_cercanos` → hasta 3 `centro` (Maps por coordenadas o por nombre + dirección/distrito + Cusco; dirección/teléfono sólo si el directorio los trae; `distancia_km` sólo con coordenadas) + `buscar_mapa` alrededor de la persona cuando hay lat/lon (fuera de Cusco: sólo `buscar_mapa`, primero); `activar_protocolo_crisis` → `llamar` 113 y 106; `agendar_actividad` → `actividad` con su id. Sin duplicados. `/chat/mensaje` devuelve siempre `acciones`; se guardan en `mensajes.acciones` con el mensaje de la asistente y `/chat/historial` y `/chat/sesiones/{id|ultima}` las devuelven (`null` → `[]`; las malformadas se descartan).
- **Tolerancia**: sin la columna, el insert se reintenta sin `acciones` y la lectura del historial se repite sin ella; un único warning en el log.
- **Migración**: `supabase/schema_v4.sql` (`alter table public.mensajes add column if not exists acciones jsonb;` + `notify pgrst, 'reload schema'`), añadida al final de `instalar_todo.sql`.
- Tests: `tests/test_acciones.py` (24 nuevos, sin red). `pytest` 86 en verde.
- **Paso del usuario**: Supabase › SQL Editor › New query › pegar `supabase/schema_v4.sql` › Run. Luego desplegar el backend en Render (commit hecho en `main`, sin push).
- Ojo: los teléfonos del directorio local (`app/locations/data/csmc_cusco.json`: 084234567, 984123456) parecen de relleno; ahora salen en botones "Llamar". Conviene verificarlos o vaciarlos.
