# AGENTS.md — Asistente Hamilton

## Stack
- React Native 0.85 + Expo SDK 56
- React 19, TypeScript 6 (strict), `@/` → `./src/*`
- NativeWind (Tailwind for RN) — prefer `className` over `StyleSheet.create`; StyleSheet acceptable for absolute fills and programmatic composite styles
- `@react-navigation` native-stack + bottom-tabs
- `react-native-reanimated` 4.3 + `react-native-worklets` plugin
- Glass: `expo-blur` + `expo-linear-gradient`
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
- `RootNavigator` switches auth stack (Splash/Login/Register, animation `fade`) vs `AppNavigator` (bottom tabs: Chat, History, Profile)
- Chat tab stack: ChatMain → Result / CrisisProtocol (animation `slide_from_right`)

### API (`src/services/api.ts`)
Talks to real FastAPI backend (`asistente-hamilton-backend`). **No mock fallback** — without the backend, login/register/chat fail with the real error message.

| Endpoint | Use |
|---|---|
| `POST /auth/register` | Register (payload: `{nombre, email, password}`) |
| `POST /auth/login` | Login (payload: `{email, password}`) |
| `POST /chat/mensaje` | Chat message; returns `resultado` when test completes |
| `POST /voz/transcribir` | Audio transcription (120s timeout, multipart FormData) |
| `GET /evaluaciones` | User evaluation history |
| `GET /salud` | Health check |

Auth: backend delegates to Supabase Auth, returns `access_token` → stored in `@auth_token` → sent as `Authorization: Bearer`. 401 triggers `setUnauthorizedHandler` → local logout. AsyncStorage caches evaluation history for offline access.

### Voice input
`useDictado` hook (`src/hooks/useDictado.ts`) wraps `expo-audio` recorder. iOS requires toggling `allowsRecording` between record/playback (recording lowers playback volume). Audio uploaded to `POST /voz/transcribir`; transcription returned as text. TTS via `expo-speech` (`src/services/voz.ts`).

## Design — Serenity Glass (dark glassmorphism)
Palette: background `#0b1326` (Midnight), primary soft blue `#c6dfff`, secondary teal `#7ad7c6`, tertiary lavender `#dfd8ff`. Non-negotiable rules:
- `src/constants/colors.ts` = single source of truth; `src/constants/glass.ts` = single glass recipe. NO hardcoded hex/rgba in components.
- All glass via `<Glass>` or `<GlassCard>`. `<GlassScrim>` for modal overlays. All glass surfaces use white-tinted fill (3–10% opacity) over dark blur (`glassTint = 'dark'`).
- `<GlassCard style>` = outer box (margins/width); padding/content alignment goes in `contentStyle`.
- `SpatialContainer` renders a deep-blue → purple gradient (Midnight Aurora) with no hard edges.
- Borders: `glassBorder`/`glassBorderStrong` (white 15–25% opacity) = glass edge. Dividers use `borderDark` (white 8%). Nested panels use `surfaceInset` (white 3%).
- AA contrast (4.5:1) on `colors.background` (#0b1326); solid fills use `*Gradient` so light text passes contrast.
- Border radii: 8px (sm), 16px (default), 24px (md), 32px (lg), 48px (xl), 9999px (full) — match `spacing.ts`.

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
