# AGENTS.md — Asistente Hamilton

## Stack
- React Native 0.85 + Expo SDK 56
- React 19, TypeScript 6 (strict), `@/` → `./src/*`
- NativeWind (Tailwind for RN) — use `className`, NOT `StyleSheet` for styling
- Navigation: `@react-navigation` native-stack + bottom-tabs
- Animations: `react-native-reanimated` 4.3 + `react-native-worklets` plugin
- HTTP: `axios` with JWT interceptor

## Commands
| Action | Command |
|--------|---------|
| Dev server | `npx expo start` |
| Web mode | `npm run web` |
| Lint + format check | `npm run lint` |
| Auto-fix + format | `npm run format` |
| Prebuild | `npm run prebuild` |

No test suite or typecheck script is configured.

## Architecture
- `App.tsx` → `SafeAreaProvider > AuthProvider > ChatProvider > NavigationContainer > RootNavigator`
- `RootNavigator` switches auth stack (Splash/Login/Register) vs `AppNavigator` (bottom tabs)
- Tabs: Chat, History, Profile
- Chat stack: ChatMain → Result / CrisisProtocol
- `api.ts` has a full built-in mock fallback — app works offline without backend
- **Design**: dark cosmic/Spatial UI theme. `src/constants/colors.ts` is the single source of truth for all colors. Components reference `colors.*` — do NOT hardcode hex values in component styles.

## Conventions & gotchas
- **ESLint**: flat config (`eslint.config.js`), NOT `.eslintrc`. Rule: `react/display-name: off`.
- **Babel**: requires `react-native-worklets/plugin` as a plugin. Preset: `babel-preset-expo` with `jsxImportSource: 'nativewind'`.
- **Metro**: configured with NativeWind, input CSS at `./global.css`.
- **Path aliases**: require TWO configs — `tsconfig.json` `paths` AND `app.json` `experiments.tsconfigPaths: true`.
- **Env vars**: must use `EXPO_PUBLIC_` prefix (Expo requirement). See `.env.example`.
- **Prettier**: `singleQuote`, `bracketSameLine`, `trailingComma: 'es5'`, `printWidth: 100`. Uses `prettier-plugin-tailwindcss` for Tailwind class sorting.
- **AsyncStorage keys**: prefixed with `@` (`@auth_token`, `@user_data`, `@eval_history`).
- **Git-ignored**: `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`, `web-build/`. `.env` is NOT gitignored.
- **Package manager**: npm (lockfile: `package-lock.json`).
- **Skills**: local skill files at `.agents/skills/` — check there before suggesting UI/UX/design patterns.

## Crisis protocol
Detection keywords: `suicid`, `matar`, `sin sentido`, `no quiero vivir`, `morir`, `terminar con todo`, `ayuda urgente`, `crisis`.
Triggering crisis mode shows helpline info (Línea 113 Opción 5, SAMU 106) and Cusco mental health centers with Google Maps integration.
