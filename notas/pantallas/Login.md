# Login

**Estado:** ✅ hecho
**Nota temporal:** acceso simulado activo (ver [[Decisiones]], `EXPO_PUBLIC_AUTH_SIMULADO`).
**Diseño:** `notas/diseño-fuente/06-login.html`
**Archivos:** `src/screens/auth/LoginScreen.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Volver (→ Bienvenida), LogoMark 48, titular "Qué bueno
verte de nuevo", subtítulo con `asistente.nombre`.
- TextField correo + contraseña (`password`), validación con `utils/validation`, errores bajo el campo y error de API visible.
- Botón Entrar (loading). Pie "¿Aún no tienes cuenta? Crear una" → Register.
- Omitidos: huella, Google, Apple, olvidaste contraseña (ver Decisiones).

## Hecho
- `src/screens/auth/LoginScreen.tsx`: volver (`goBack`, o → Bienvenida si no hay historial), `LogoMark` 48, titular 30 px, subtítulo con `asistente.nombre`, `TextField` correo + contraseña (`password`, ojo), validación con `utils/validation` (errores bajo cada campo, se limpian al escribir), aviso `ErrorApi` con el mensaje real del backend, botón "Entrar" con `loading`, pie "¿Aún no tienes cuenta? Crear una" → `popTo('Register')` (evita apilar Login/Register repetidos). Enter en correo salta a contraseña; en contraseña envía.
- Piezas en `src/screens/auth/components/AuthBits.tsx` (`EnlacePie`, `ErrorApi`).

## Desviaciones del diseño
- Omitidos (ver [[Decisiones]]): "¿Olvidaste tu contraseña?", "Entrar con huella", separador "o continúa con", Google y Apple. Por eso el pie queda abajo con `marginTop: 'auto'`.
- El `LogoMark` 48 se escala entero (en el HTML el SVG mide 48 pero el círculo sigue siendo de 34).
- Error de API: se muestra en un aviso `dangerBg` bajo los campos en vez del `Alert.alert` anterior.

> ✅ **Resuelto (2026-10-08):** el Splash desmontaba el formulario durante login/registro. `AuthContext.login/register` ya no activan `isLoading` (ver [[Decisiones]]).

## Revisión producción (2026-10-08)
- Doble envío: candado síncrono con `useRef` (`enviando`) además de `loading`; un doble toque o Enter + botón ya no lanzan dos `login`. El botón muestra `loading` y queda desactivado.
- Teclado: `<Screen scroll keyboard>` (KeyboardAwareScrollView de keyboard-controller). Correo: `email-address`, `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="email"`, `textContentType="emailAddress"`, `returnKeyType="next"` + `submitBehavior="submit"` (no cierra el teclado) → contraseña. Contraseña: `autoCorrect={false}`, `current-password`/`password`, `returnKeyType="go"`, `submitBehavior="blurAndSubmit"`, envía.
- Al enviar se cierra el teclado (`Keyboard.dismiss`) para que el aviso de error/carga quede visible.
- Validación fallida: enfoca el primer campo con error y vibra (`vibrarError`); también vibra si la API devuelve error.
- 360×640: la pantalla se desplaza; con el teclado abierto el campo enfocado queda 24 px sobre el teclado y "Entrar" es alcanzable desplazando o con la tecla "Ir".

## Adaptación Android/iOS (2026-10-12)
- Compacto: huecos 16, padding superior 8, LogoMark 40, titular 27. Cabe en 375×667 sin desplazar; con teclado o fuente grande, desplaza (KeyboardAwareScrollView).
