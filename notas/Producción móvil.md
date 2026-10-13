# Producción móvil

Revisión para publicar (iniciada 2026-10-08, a pedido del usuario). El backend se conecta después; mientras tanto el acceso es simulado (ver [[Decisiones]]).

## Infraestructura nueva (YA HECHA por la sesión principal)
| Qué | Dónde | Uso |
|---|---|---|
| Teclado fiable (Android edge-to-edge + iOS) | `react-native-keyboard-controller`, `<KeyboardProvider>` en `App.tsx` | Importar `KeyboardAvoidingView`, `KeyboardAwareScrollView`, `KeyboardStickyView` **desde `react-native-keyboard-controller`**, nunca el `KeyboardAvoidingView` de `react-native`. |
| `Screen keyboard` | `components/ui/Screen.tsx` | Con `scroll` → `KeyboardAwareScrollView` (el campo enfocado sube solo); sin `scroll` → `KeyboardAvoidingView` padding. |
| Permiso de micrófono | `hooks/usePermisoMicrofono.ts` → `{ estado: 'cargando'\|'pendiente'\|'concedido'\|'bloqueado', pedir(), abrirAjustes(), refrescar() }` | Explicar antes de pedir; si está bloqueado, llevar a Ajustes. Se re-consulta al volver a la app. |
| Tarjeta de permiso | `components/PermisoMicrofono.tsx` (`tono="light"\|"dark"`) | Mostrar cuando `estado` es `pendiente` o `bloqueado`. |
| Chat con teclado arriba | `navigation/types.ts`: `Chat: { enfocar?: boolean }` | `navigate('Chat', { enfocar: true })` → ChatScreen hace `autoFocus` del input. |
| Hápticos | `expo-haptics` instalado | Respuesta táctil en acciones clave (grabar, enviar, toggles). Ligero, no en todo. |
| `ErrorBoundary` | `components/ErrorBoundary.tsx` en `App.tsx` | Pantalla tranquila con reintentar + línea de ayuda. |
| Iconos y splash | `assets/icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png` (fuentes SVG en `notas/assets/`) | Isotipo Aliento sobre crema. Antes: icono con cuadriculado falso de transparencia y bordes azules. |
| `app.json` | `ios.bundleIdentifier`, `ITSAppUsesNonExemptEncryption:false`, textos de permisos en español (micrófono, ubicación, fotos), permisos Android mínimos + `blockedPermissions`, `softwareKeyboardLayoutMode: resize`, splash/adaptive crema | |
| `eas.json` | `preview` (APK interno) y `production` (AAB para Play Store, `autoIncrement`, versión remota) | |

## Checklist por pantalla (lo revisan los agentes)
- [x] Todo `TextInput` abre el teclado al tocar cualquier parte del campo, y el campo queda visible por encima del teclado.
- [x] `returnKeyType` encadenado (siguiente → enviar), `autoComplete`/`textContentType`, `autoCapitalize`, `keyboardType` correctos.
- [x] Modales con campos: `KeyboardAvoidingView` de keyboard-controller, `onRequestClose` (botón atrás de Android), `statusBarTranslucent`.
- [x] Micrófono: tarjeta de permiso antes del diálogo del sistema; caso bloqueado → Ajustes.
- [x] Safe areas arriba/abajo, pantallas pequeñas (≈ 360×640) sin cortes, texto que no desborda.
- [x] Toques ≥ 44 px, `accessibilityLabel`/`Role`, contraste.
- [x] Estados de carga / vacío / error sin cifras inventadas.
- [x] `Linking` (tel:, mapas) con manejo de error si no se puede abrir.
- [x] Sin `console.log` de depuración, sin hex a mano, sin `fontWeight`.

## Pendiente fuera de esta revisión
- ~~Notificaciones reales del "Recordatorio diario"~~ ✅ hecho, ver [[Notificaciones y voz]]. Probar en APK/build de desarrollo (Expo Go Android no las soporta).
- ~~Conectar backend real~~ ✅ (2026-10-12), ver [[Integración backend y adaptación]].
- ✅ Nombre visible de la app: **aliento** (2026-10-12, decisión del usuario). Aurora sigue siendo la asistente. Identificadores `com.rdo0711.aurora` sin cambiar (aún no publicada; cambiarlos después sería una app nueva).
- Probar en dispositivo: necesita `npx expo start -c` (Expo Go) o nuevo build EAS (se añadieron módulos nativos: keyboard-controller, system-ui, haptics).
- **Términos y privacidad**: ✅ pantalla en la app (2026-10-12). Falta: correo de contacto, revisión legal y URL pública para las tiendas.
- **Probar primero en Android real:** barra del chat sobre el teclado (offset negativo), con navegación por gestos y con 3 botones.
- ~~Hermes V1 (regresión en SDK 56)~~ → resuelto: el proyecto está en **Expo SDK 57 / RN 0.86.3** (2026-10-12), `expo-doctor` 21/21. Hay que probarlo en dispositivo.

## Estado de la revisión (2026-10-08)
- 5 agentes revisaron auth, chat, voz, inicio/actividades/perfil y registro/recursos/crisis (ver sección "Revisión producción" de cada nota en `pantallas/`).
- `tsc` 0 errores, `eslint` 0 errores, `prettier` limpio, `expo install --check` al día, `expo-doctor` 21/22 (sólo Hermes).
- Instalados `expo-font` y `expo-asset` como dependencias directas (sin ellos el APK podía fallar fuera de Expo Go). Quitados `expo-blur` y `expo-linear-gradient` (sin uso).
- Web: título de pestaña. (NativeWind eliminado el 2026-10-12, ver [[Decisiones]].)
- Verificado en web: Inicio y Perfil se ven como el diseño; estados sin conexión correctos.

## ¿Lista para usarse? (2026-10-12)
- [x] Supabase nuevo con tablas y bucket (verificado).
- [x] Render conectado al Supabase nuevo (verificado 2026-10-12).
- [x] Confirmación de correo: ya no hace falta (registro auto-confirmado desde el backend).
- [ ] iPhone/Expo Go: confirmar con foto que carga `botones-v3` y que se ven los botones.
- [ ] Probar APK (`eas build -p android --profile preview`): registro, chat, voz, recordatorio.
- [ ] Tiendas: correo de contacto + revisión legal + URL pública de privacidad; cuentas de desarrollador (Google Play pago único, Apple anual); capturas y ficha.
- [ ] Opcional: Azure para voz en la nube.
