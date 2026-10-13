# AGENTS.md — Asistente Hamilton (app "aliento")

> **Working notes (Obsidian):** the repo root is an Obsidian vault. Before changing anything read `notas/00 Índice.md`, `notas/Rediseño Aliento.md` and the screen's note in `notas/pantallas/`. After each change update that note and add a line to `notas/Bitácora.md`; decisions go in `notas/Decisiones.md`.

## Stack
- React Native 0.86 + Expo SDK 57
- React 19, TypeScript 6 (strict), `@/` → `./src/*`
- NativeWind (Tailwind for RN) — prefer `className` over `StyleSheet.create`; StyleSheet acceptable for absolute fills and programmatic composite styles
- `@react-navigation` native-stack + bottom-tabs
- `react-native-reanimated` 4.3 + `react-native-worklets` plugin
- UI: `react-native-svg` (design icons/illustrations) + `@expo-google-fonts/figtree`
- Voice: `expo-audio` (dictation/recording) + `expo-speech` (TTS)
- Location: `expo-location` (mental health center search in crisis)
- HTTP: `axios` with JWT interceptor

## Commands
| Action | Command |
|--------|---------|
| Dev server | `npx expo start` |
| Web mode | `npm run web` |
| Lint + format check | `npm run lint` |
| Auto-fix + format | `npm run format` |
| Prebuild | `npm run prebuild` |

No test or typecheck scripts configured.

## Environment
`.env` is **not** gitignored. All env vars must use `EXPO_PUBLIC_` prefix (Expo requirement):

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000   # 10.0.2.2 for Android emulator
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## Architecture
- `App.tsx` → `SafeAreaProvider > AuthProvider > ChatProvider > NavigationContainer > RootNavigator`
- `RootNavigator` (types in `src/navigation/types.ts`): signed out → Bienvenida → Login / Register; signed in → `MainApp` (tabs) plus `Chat`, `Voz`, `Actividades`, `Result`, `CrisisProtocol` stacked on top without tab bar.
- `AppNavigator` (custom `components/TabBar.tsx`): Inicio · Registro · Recursos · Perfil.

### API (`src/services/api.ts`)
Talks to real FastAPI backend (`asistente-hamilton-backend`). **No mock fallback** — without the backend, login/register/chat fail with the real error message.

| Endpoint | Use |
|---|---|
| `POST /auth/register` | Register (payload: `{nombre, email, password}`) |
| `POST /auth/login` | Login (payload: `{email, password}`) → `{token, refresh_token?, expires_in?, user}` |
| `POST /auth/refresh` | Renews the Supabase token (app retries once on 401; `@refresh_token`) |
| `GET /auth/me` | Validates the stored session at startup (background) |
| `POST /chat/mensaje` | Chat message; returns `resultado` when test completes |
| `POST /voz/transcribir` | Audio transcription (120s timeout, multipart FormData) |
| `POST /voz/sintetizar` | Cloud TTS (Azure, `es-PE-CamilaNeural`), 503 if not configured → phone voice. App flag `EXPO_PUBLIC_TTS_NUBE` |
| `GET /perfil`, `PUT /perfil`, `POST /perfil/foto`, `GET/POST/PATCH/DELETE /actividades`, `GET /diagnostico`, `GET /chat/historial` | See services/ |
| `GET /evaluaciones` | User evaluation history |
| `GET /salud` | Health check |

Render cold start (~60 s): app pings `/salud` on launch; `useAuth().servidorDespertando` + `<AvisoDespertando>` show a calm notice. `EXPO_PUBLIC_AUTH_SIMULADO` (off) keeps a local-only login for demos.

Auth: backend delegates to Supabase Auth, returns `access_token` → stored in `@auth_token` → sent as `Authorization: Bearer`. 401 triggers `setUnauthorizedHandler` → local logout. AsyncStorage caches evaluation history for offline access.

### Voice input
`useDictado` hook (`src/hooks/useDictado.ts`) wraps `expo-audio` recorder. iOS requires toggling `allowsRecording` between record/playback (recording lowers playback volume). Audio uploaded to `POST /voz/transcribir`; transcription returned as text. TTS via `expo-speech` (`src/services/voz.ts`).

## Design — Aliento (light, sage + peach)
Visual source: `notas/diseño-fuente/*.html` (Claude Design export, 390×844). Full detail in `notas/Rediseño Aliento.md`.
- `src/constants/colors.ts` = single source of truth (background `#F3F4EF`, white surfaces, `sage #DDE6DC`, `forest #2F4A3E`, `ink #1F2A26`, `accent #E8A87C`, crisis `dangerBg`/`dangerInk`, voice mode `voiceBg #22302B`). NO hardcoded hex/rgba in components.
- Figtree font via `src/constants/typography.ts`; use `<Txt weight>` — never bare `fontWeight` (Android doesn't switch font files).
- Primitives in `src/components/ui/`: `Txt`, `Title`, `Icon` (SVG from the design), `Button`, `Card`, `TextField`, `Toggle`, `Screen`, `Logo`, `IconTile`, `IconButton`, `Chip`, `ProgressBar`, `HelpButton`, `Divider`.
- Flat surfaces, no shadow/blur/gradients. Radii: 22 cards, 18 list rows, 14–16 cells/inputs, full pills (`radius` in `spacing.ts`). Touch targets ≥ 44 px.
- Adaptive layout: `hooks/useLayout` (compacto / bajo / tablet / escala); `Screen` centers content at 560 px on tablets; `Txt` caps system font scale (1.35, titles 1.2). Android ripples use `colors.ripple`/`rippleOnDark`.
- Local-only data: `utils/animo.ts` (`@mood_log`, daily mood check-in) and `utils/preferencias.ts` (`@preferencias`).

## Conventions & gotchas
- **ESLint**: flat config (`eslint.config.js`), NOT `.eslintrc`. Rule `react/display-name: off`.
- **Babel**: preset order matters — `babel-preset-expo` before `nativewind/babel`. Plugin `react-native-worklets/plugin` required.
- **Metro**: NativeWind configured with input CSS at `./global.css`.
- **Path aliases**: require TWO configs — `tsconfig.json` `paths` AND `app.json` `experiments.tsconfigPaths: true`.
- **Prettier**: `singleQuote`, `bracketSameLine`, `trailingComma: 'es5'`, `printWidth: 100`, `prettier-plugin-tailwindcss`.
- **Tailwind**: custom colors in `tailwind.config.js` mirror `src/constants/colors.ts`.
- **AsyncStorage keys**: prefixed with `@` (`@auth_token`, `@user_data`, `@eval_history`, `@onboarded`).
- **Git-ignored**: `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`, `web-build/`. `.env` is NOT gitignored.
- **Package manager**: npm (`package-lock.json`).
- **Skills**: local skill files at `.agents/skills/`.

## Crisis protocol
Detection keywords: `suicid`, `matar`, `sin sentido`, `no quiero vivir`, `morir`, `terminar con todo`, `ayuda urgente`, `crisis`.
Triggering crisis mode shows helpline info (Línea 113 Opción 5, SAMU 106) and Cusco mental health centers with Google Maps integration. Location permissions requested on demand via `ubicacion_solicitada` flag from the backend.

## Conversación continua (v2)
- El backend mantiene **un hilo único por usuario**, estilo mensajería. La app NO gestiona `sesion_id`: envía el mensaje y el backend elige el hilo abierto del usuario.
- Al abrir, `ChatContext` carga `GET /chat/historial` (toda la conversación). El flag `restaurando` indica que aún se está trayendo.
- Memoria del asistente: tabla `preferencias` + perfil + actividades pendientes se inyectan en el system prompt (`app/chat/companero.py` en el backend). Por eso recuerda gustos entre sesiones aunque se recorte el historial reciente.
- Voz: TTS en el dispositivo (`expo-speech`, con limpieza de markdown y troceo en `src/services/voz.ts`); STT en el backend (`POST /voz/transcribir`).
- Perfil: `src/services/perfil.ts` → `GET/PUT /perfil`, `POST /perfil/foto` (Supabase Storage) y `GET /actividades`.
- Endpoints nuevos del chat: `GET /chat/historial`, `GET /chat/sesiones`, `GET /chat/sesiones/ultima`, `GET /chat/sesiones/{id}`.
