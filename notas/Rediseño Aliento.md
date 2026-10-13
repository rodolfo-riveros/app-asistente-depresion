# Rediseño "Aliento"

Migración de la app del tema oscuro **Serenity Glass** (glassmorphism) al diseño claro **Aliento** hecho en Claude Design. Fuente visual: `notas/diseño-fuente/NN-*.html` (390×844, estilos inline = valores exactos).

Inicio del trabajo: 2026-10-08.

## Lenguaje visual
- Fondo crema `#F3F4EF`, tarjetas blancas planas **sin sombra**, radio 22 (tarjetas), 18 (filas), 14–16 (celdas/campos), píldoras `9999`.
- Verde salvia como superficie suave (`sage #DDE6DC`), verde bosque `forest #2F4A3E` para acentos de UI (burbuja del usuario, links, toggles ON), tinta `ink #1F2A26` para texto y botón principal.
- Acento melocotón `accent #E8A87C` (sol del logo, tarjeta "Hablar", avatar). El diseño ofrece variantes lavanda `#C9B6E4` y amarillo `#F2C879`, no usadas.
- Ayuda/crisis: fondo `dangerBg #F6DCD3` + texto `dangerInk #7A2E1E`. Siempre visible en Bienvenida, Inicio, Chat, Voz, Recursos.
- Modo voz: única pantalla oscura (`voiceBg #22302B`).
- Tipografía **Figtree** (400/500/600/700). Titulares 28–34 px bold con tracking negativo; cuerpo 15; secundarios 12.5–13.5 en `inkSoft #4C5853`.
- Tono: cálido, sobrio, sin decoración gratuita. Nada de vidrio, blur, gradientes ni brillos.

## Base compartida (YA HECHA — no modificar sin avisar en [[Bitácora]])
| Archivo | Qué es |
|---|---|
| `src/constants/colors.ts` | Tokens de color (`colors.*`) + `moodScale` (5 niveles de ánimo). ÚNICA fuente de hex. |
| `src/constants/spacing.ts` | `spacing`, `radius`, `sizes`. |
| `src/constants/typography.ts` | `fonts.regular/medium/semibold/bold` (familias Figtree). No usar `fontWeight`. |
| `src/constants/asistente.ts` | `app.nombre` ("aliento"), `asistente.nombre` (Aurora), `asistente.saludo`, `lineaAyuda` (113 opc. 5). |
| `src/components/ui/` | Primitivas: `Txt`, `Title`, `Icon` (SVG del diseño), `Button` (primary/secondary/outline/ghost/danger/accent; lg/md/sm), `Card` (tones white/sage/peach/danger/muted/dark/accent), `TextField` (label, error, hint, `password`), `Toggle`, `Screen` (safe area + fondo + padding + scroll/keyboard), `Logo`, `LogoMark`, `IconTile`, `IconButton`, `Chip`, `ProgressBar`, `HelpButton` (bar/compact), `Divider`, `llamarLineaAyuda()`. Importar desde `../../components/ui`. |
| `src/components/TabBar.tsx` | Barra inferior blanca 4 pestañas. |
| `src/navigation/types.ts` | `RootStackParamList`, `TabParamList`, `RootScreenProps<'X'>`, `TabScreenProps<'X'>`. `useNavigation()` está tipado globalmente. |
| `src/navigation/RootNavigator.tsx` | Sin sesión: Bienvenida → Login / Register. Con sesión: `MainApp` (tabs) + `Chat`, `Voz`, `Actividades`, `Result`, `CrisisProtocol` encima (sin tab bar). |
| `src/navigation/AppNavigator.tsx` | Tabs: `InicioTab`, `RegistroTab`, `RecursosTab`, `PerfilTab`. |
| `src/utils/animo.ts` | Check-in de ánimo local (`@mood_log`): `animo.guardar(0-4)`, `deHoy()`, `semanaActual()`. Inicio escribe, Registro lee. |
| `src/utils/preferencias.ts` | Preferencias locales (`@preferencias`): recordatorio diario, notificaciones discretas, persona de confianza. |

Eliminado: `Glass`, `GlassCard`, `SpatialContainer`, `HologramAvatar`, `AvatarAssistant`, `VoiceWave`, `CustomTabBar`, `AuthButton`, `AuthInput`, `constants/glass.ts`, `ChatNavigator`. Para ver el código anterior: `git show HEAD:<ruta>`.

## Reglas para quien implemente una pantalla
1. **Lee primero** esta nota, [[Decisiones]] y la nota de tu pantalla en `notas/pantallas/`.
2. Reproduce el HTML de referencia fielmente (medidas, textos, colores) usando las primitivas de `components/ui`. Si necesitas algo que no existe, créalo **dentro de tu pantalla** o en un archivo propio (`src/screens/<x>/components/…`), no edites `components/ui` ni `constants`.
3. Nada de hex/rgba a mano: todo sale de `colors`. Nada de `fontWeight`: usa `<Txt weight>` o `fonts.*`.
4. **Conserva toda la lógica real** (servicios, contextos, API). El diseño muestra datos de ejemplo: sustitúyelos por los reales; si no existe el dato, usa un estado vacío honesto, no inventes cifras.
5. No añadas botones que no hagan nada (p. ej. login con Google/Apple/huella: el backend no lo soporta → se omiten; ver [[Decisiones]]).
6. Accesibilidad: objetivos táctiles ≥ 44 px, `accessibilityLabel` en botones de icono, contraste AA.
7. Al terminar: actualiza tu nota de pantalla (estado ✅, archivos tocados, desviaciones del diseño). Los agentes en paralelo **no** editan [[Bitácora]] ni notas ajenas (evita choques de escritura); la sesión principal consolida la bitácora.
8. Comprueba tipos de tus archivos: `npx tsc --noEmit -p . 2>&1 | grep <tu-carpeta>` y `npx eslint <tus archivos>`.

## Mapeo pantalla ↔ código ↔ datos
| Diseño | Archivo | Datos reales |
|---|---|---|
| 1 Bienvenida | `screens/auth/WelcomeScreen.tsx` | estático; consentimiento → Register |
| 2 Inicio | `screens/inicio/InicioScreen.tsx` | `animo`, `actividadesService.listar('pendientes')`, `diagnosticoService` (resumen registro), `useAuth().user` |
| 3 Chat | `screens/chat/ChatScreen.tsx` (+ `ChatBubble`, `TypingIndicator`, `CrisisAlert`, `LocationPermissionModal`, `WelcomeModal`) | `useChat()` |
| 4 Voz | `screens/voz/VozScreen.tsx` | `useChat()`, `useDictado()`, `voz` (TTS) |
| 5 Registro | `screens/registro/RegistroScreen.tsx` (antes Diagnóstico) + `ResultScreen`, `ResultCard` | `diagnosticoService`, `animo.semanaActual()`, ficha PDF |
| 6 Login | `screens/auth/LoginScreen.tsx` | `useAuth().login` |
| 7 Crear cuenta | `screens/auth/RegisterScreen.tsx` | `useAuth().register`, `preferencias` |
| 8 Recursos | `screens/recursos/RecursosScreen.tsx` + `CrisisProtocolScreen` | contenido estático + `location` (centros Cusco) |
| 9 Perfil | `screens/profile/ProfileScreen.tsx` | `perfilService`, `diagnosticoService` (stats), `preferencias`, `logout` |
| (apoyo) Actividades | `screens/actividades/ActividadesScreen.tsx` | `actividadesService` |

## Estado
Ver tabla en [[00 Índice]] y cada nota de `pantallas/`.
