# Bienvenida

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/01-bienvenida.html`
**Archivos:** `src/screens/auth/WelcomeScreen.tsx`, `src/screens/auth/SplashScreen.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Logo + link "Iniciar sesión" → Login. Ilustración SVG del sol/colinas (184 px, radio 28, fondo sage).
- Titular 34 px "Habla.
Aquí nadie te juzga." + texto con `asistente.nombre`.
- 3 filas con IconTile blanco (lock, chat, heart).
- Checkbox de consentimiento (términos/privacidad); sin marcar, "Empezar a conversar" se desactiva. Botón → Register.
- Pie con Línea 113 (tocable: llama).
- Splash: fondo crema + LogoMark + nombre, sin glass.

## Hecho
- `src/screens/auth/WelcomeScreen.tsx`: cabecera (`Logo` + "Iniciar sesión" → Login), ilustración del amanecer, titular 34 px, texto con `asistente.nombre`, 3 filas `IconTile` blancas 40 px radio 12 (lock/chat/heart), casilla de consentimiento, botón "Empezar a conversar" con flecha (desactivado sin consentimiento) → Register, pie con `lineaAyuda.etiqueta` tocable (`llamarLineaAyuda`). `Screen scroll` para pantallas bajas; el bloque final va con `marginTop: 'auto'`.
- `src/screens/auth/SplashScreen.tsx`: fondo crema, `LogoMark` 72, `app.nombre` 30 px bold, `ActivityIndicator` forest. Sin glass.
- `src/screens/auth/components/AuthBits.tsx` (nuevo, compartido por las pantallas de auth): `AmanecerIlustracion` (SVG del diseño con tokens `accent`/`sageMid`/`moss`/`background`), `Checkbox`, `MedidorContrasena` + `fuerzaContrasena`, `EnlacePie`, `ErrorApi`, `PASSWORD_MIN`.

## Desviaciones del diseño
- La casilla de consentimiento empieza **desmarcada** (el diseño la muestra marcada): el consentimiento debe ser explícito, y así el botón se desactiva como pide la nota.
- "términos" y "política de privacidad" se ven en verde semibold pero **no son enlaces**: no hay pantalla ni URL de términos todavía (regla: nada de botones que no hagan nada). Cuando exista, convertirlos en `Pressable`.
- La ilustración usa `preserveAspectRatio="xMidYMax slice"` para llenar el ancho en pantallas distintas de 390.
- Las filas tocables (casilla, pie de ayuda, "Iniciar sesión") tienen alto mínimo 44 px por accesibilidad.

> ✅ **Resuelto (2026-10-08):** el Splash desmontaba el formulario durante login/registro. `AuthContext.login/register` ya no activan `isLoading` (ver [[Decisiones]]).

## Revisión producción (2026-10-08)
- Pie "Línea 113": ahora usa `llamarAyuda` (en `components/AuthBits.tsx`), que captura el fallo de `Linking.openURL('tel:113')` (tablet sin SIM, simulador) y muestra un `Alert` con el número para marcarlo a mano. Antes la promesa rechazada quedaba sin manejar.
- Comprobado: `Screen scroll` + safe area arriba/abajo; en 360×640 el contenido se desplaza y el bloque final (casilla, botón, ayuda) es alcanzable. Toques ≥ 44 px y `accessibilityRole`/`Label` en casilla, "Iniciar sesión", botón y pie. Sin campos de texto.
- Splash: sin cambios (sin interacción; `accessibilityLabel` "…, cargando").
- Nuevo en `AuthBits.tsx`: `vibrarError()` (háptico `Error` de expo-haptics, silencioso si falla) y `llamarAyuda()`.

## Adaptación Android/iOS (2026-10-12)
- `useLayout()`: ilustración 96 px en pantallas bajas (< 700; 72 con fuente > 110 %), 140 en compacto, `escala(184)` en el resto (`AmanecerIlustracion` acepta `height`).
- Compacto: padding 20, huecos 14, titular 28–30, IconTile 36 + texto 14, bloque final con gap 8 → en 375×667 cabe sin desplazar con la fuente normal; con fuente 130 % se desplaza.

## Privacidad y términos (2026-10-12)
- Enlaces/fila abren `Legal` (privacidad o términos). Ver [[Decisiones]].
