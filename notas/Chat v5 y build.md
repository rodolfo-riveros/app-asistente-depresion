# Chat v5, contacto de emergencia, PDF y build

Pedido del usuario (2026-10-13):
- Preparar para **Expo Go** y **APK** (EAS).
- Chat natural como un amigo; **preguntas cerradas con botones tipo encuesta** (Sí/No y opciones cortas, también en ítems del test).
- **Analizar lo que escribe** para recomendar algo concreto (p. ej. salir a caminar) y ofrecer agendarlo.
- **Quitar la foto de perfil** (saturaría el almacenamiento).
- **Modo recuperación**: si ya está superando la depresión, dejar el test y conversar de otros temas / cómo se siente.
- PDF para el psicólogo **más trabajado**, con **contacto de emergencia**.
- Si hay ideación suicida: **contactar a su persona de confianza** (decisión: la app no puede llamar sola — iOS/Android no lo permiten y debe haber consentimiento; se muestran botones grandes "Llamar a X" / "Enviarle un mensaje" con texto ya escrito).
- Pregunta respondida: cifrado = TLS en tránsito + disco cifrado en Supabase; no es extremo a extremo (la IA debe leer). Propuesta pendiente: cifrar `mensajes.contenido` en la base de datos.

## Contrato nuevo (app ↔ backend)
`POST /chat/mensaje` → además de lo de v4: **`opciones: string[]`** (respuestas rápidas para la ÚLTIMA pregunta de la asistente; `[]` si no hay; máx. 5, cada una ≤ 32 caracteres). No se guardan en el historial (sólo valen para el mensaje actual).

`Accion` nueva: **`{ tipo: 'contacto_confianza'; titulo: string }`** — el backend la añade al activar el protocolo de crisis (además de `llamar` 113/106). La app la resuelve con la persona de confianza guardada en el teléfono (`preferencias.personaConfianza`): botones "Llamar a {nombre}" y "Enviarle un mensaje" (SMS / WhatsApp con texto preescrito); si no hay persona guardada, "Añadir persona de confianza" → Perfil.

## Reparto
- **Backend**: tool `ofrecer_opciones`, prompt (preguntas cerradas con opciones, análisis proactivo → recomendación concreta + "¿Lo agendamos?", modo seguimiento/recuperación), `contacto_confianza` en crisis, tests.
- **App**: botones de respuesta rápida, quitar foto, contacto de confianza en crisis, PDF profesional.
- **Principal**: Expo Go Android (notificaciones) ✅, preparación del build APK.

## Estado
- Backend: ✅ `ofrecer_opciones` → `opciones` en `/chat/mensaje`, propuesta concreta + "¿Lo agendamos?", modo seguimiento calculado en el backend, `contacto_confianza` en crisis, tests (2026-10-13, commit `099dd93` en `main`, sin push)
- App: ✅ respuestas rápidas, sin foto de perfil (`expo-image-picker` fuera), contacto de confianza en crisis, informe PDF A4 para el psicólogo (2026-10-13, rama `rediseno-aliento`, sin push)
- Build: ✅ listo para EAS (verificado 2026-10-13): `eas build -p android --profile preview`

## Backend · Hecho
- **`opciones`** (`POST /chat/mensaje`, siempre presente, `[]` por defecto): tool `ofrecer_opciones(opciones)`; el backend las limpia (`acciones.normalizar_opciones`): espacios colapsados, recorte a 32 caracteres (por palabra si se puede), sin duplicados (sin distinguir mayúsculas), máx. 5; si quedan < 2 → `[]` y el modelo recibe `opciones_invalidas`. Si se llama varias veces en el turno, vale la última válida. **No se guardan** en `mensajes` ni salen en `/chat/historial`.
- **Prompt** (`app/prompts/system_prompt.py`): preguntas cerradas → `["Sí","No"]` o variantes ("Sí, me gustaría", "Ahora no"). Ítems del test → opciones que mapean 1 a 1 a la escala: escala_5 "Nada/Un poco/Bastante/Mucho/Muchísimo" → 0–4; escala_insomnio "No/A veces/Casi siempre" → 0–2; escala_3 "No/Un poco/Mucho" → 0–2; se registra el valor correspondiente y siempre puede escribir libre. **El ítem 3 (ideación suicida) va sin botones** (decisión de seguridad). Nunca opciones en preguntas abiertas ni cuando se desahoga.
- **Propuesta concreta**: sección "Lee entre líneas": señales (encierro, sedentarismo, mal sueño, estrés de estudios, soledad, rumiación) → UNA acción pequeña adaptada (caminar 10 min, sol de la mañana, llamar a alguien, `recomendar_recurso` respiración/grounding/sueño, `recomendar_musica`) + `["Sí, agéndalo","Ahora no"]` → `agendar_actividad` con fecha concreta. Máx. una por respuesta y no en cada mensaje. Para poder poner fecha, el system prompt lleva un bloque **FECHA Y HORA** (Perú, UTC-5).
- **Modo seguimiento** (`app/chat/seguimiento.py`, bloque `ESTADO DE LA PERSONA` en el system prompt del turno, calculado con las 5 últimas evaluaciones). Umbrales:
  - Seguimiento si el último nivel es **"Sin depresión"**, o si la tendencia **mejora claramente** (baja ≥ 1 nivel, o ≥ **6 puntos** HDRS frente a la evaluación anterior) y el último nivel **no** es "Depresión severa".
  - Si no hay evaluaciones o el estado es estable/empeora/severa → ritmo normal del test; si empeora, atención extra y sugerir apoyo profesional.
  - En seguimiento: no inicia ni continúa ítems por su cuenta; habla de cómo se siente, logros, prevención de recaídas y planes; sólo retoma la evaluación si la persona lo pide o hay señales claras de empeoramiento durante varios mensajes (con suavidad). Test a medias → no insiste. Crisis igual que siempre.
  - Si la BD falla, no se añade el bloque (comportamiento normal).
- **Crisis**: `activar_protocolo_crisis` → `llamar` 113, `llamar` 106 y `{tipo:'contacto_confianza', titulo:'Avisar a tu persona de confianza'}`. El prompt anima con tacto a contactar a alguien de confianza y **nunca** dice que la app o Aurora llamarán/avisarán solas.
- Ítems, escalas, SVM y protocolo de crisis sin cambios clínicos. `app/ml/` intacto.
- Tests: `tests/test_chat_v5.py` (nuevo) + `test_acciones.py` ajustado; `pytest` 111 en verde, sin red. AGENTS.md y README (sección 12) actualizados. Requiere desplegar en Render (no hace falta migración).

## App · Hecho
- **Respuestas rápidas**: `opciones?: string[] | null` en `ChatMessageResponse` y `opciones?` en `ChatMessage`; `normalizarOpciones` (`utils/acciones.ts`, tolerante: textos no vacíos, sin duplicados, ≤ 32 caracteres, máx. 5). Sólo se adjuntan a la respuesta recién llegada (nunca a mensajes restaurados). `screens/chat/components/RespuestasRapidas.tsx`: bajo el **último** mensaje si es de la asistente y no se está cargando; 2–3 opciones → filas a todo el ancho (radio 18), 4–5 → píldoras que parten línea; borde `forest`, ≥ 44 px, háptico ligero; tocar envía el texto como mensaje de la persona y desaparecen. El campo de texto sigue libre. `FlatList` con `extraData`.
- **Sin foto de perfil**: avatar = inicial sobre `accent` (decorativo, sin insignia ni toque). Fuera `subirFoto` y `foto_url` (`services/perfil.ts`), `npm uninstall expo-image-picker` y su plugin/permiso de fotos en `app.json`. Privacidad: "la app no guarda fotos" + la ficha PDF incluye ánimo y persona de confianza y sólo sale del teléfono si la persona la comparte.
- **Contacto de confianza**: `Accion` `contacto_confianza` (tipo + `normalizarAcciones`). `components/ContactoConfianza.tsx` lee `preferencias.personaConfianza` (se relee al enfocar): "Llamar a {nombre}" (`llamar` de `recursos/enlaces`, con copiar número si falla), "Enviarle un mensaje" (WhatsApp `https://wa.me/51XXXXXXXXX?text=` si es móvil peruano de 9 dígitos → si falla, SMS → si falla, Alert con "Copiar número") y "Por SMS" (`sms:` con `&body=` en iOS, `?body=` en Android). Texto: "Hola, soy {apodo}. No me siento bien y me gustaría hablar contigo. ¿Puedes llamarme?". Sin persona → "Añadir persona de confianza" → `MainApp › PerfilTab { personaConfianza: true }` (abre la hoja; el parámetro se limpia al cerrarla). Aviso: "La app no llama ni escribe por ti: tú decides…". Usado en `AccionesMensaje`, `CrisisAlert` (tras 113/106; cierra el aviso antes de navegar) y arriba en `CrisisProtocolScreen`.
- **Informe PDF** (`utils/fichaPdf.ts`): `prepararHtmlFicha(ficha, {apodo, correo})` reúne lo del teléfono (`@mood_log`, `@preferencias`) y `GET /actividades?estado=todas` (sin red → se indica) y arma un A4 (`printToFileAsync` 595×842): cabecera "aliento" + fecha/hora de emisión, aviso "herramienta de apoyo, no diagnóstico", 1 datos de la persona (nombre/apodo, edad, ciudad, ocupación, correo, primera conversación), 2 **contacto de emergencia**, 3 última evaluación (puntaje /52, nivel, fecha, tendencia, barra de severidad por tramos con marcador, interpretación, recomendaciones), 4 tabla de los 17 ítems ("No registrado" + mini barra de intensidad), 5 evolución (gráfico SVG con franjas de severidad + tabla con cambio), 6 ánimo 14 días (barras con colores de `moodScale`, días registrados y media), 7 actividades (resumen + tabla con estado y motivo de no realizada, máx. 20), 8 observaciones y firma (colegiatura C.Ps.P.); pie con aviso legal (Ley 29733). Colores interpolados de `colors`; lo que falta = "Sin registro". Sólo se llama desde Registro (Resultado no exporta PDF).
- Verificado: `tsc` limpio, `eslint src` sin errores (queda el aviso previo de `api.ts`), Prettier, `npx expo export --platform android` compila. Falta probar en dispositivo: abrir WhatsApp/SMS y el PDF impreso.
