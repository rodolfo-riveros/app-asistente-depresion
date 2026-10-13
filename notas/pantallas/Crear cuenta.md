# Crear cuenta

**Estado:** ✅ hecho
**Nota temporal:** acceso simulado activo (ver [[Decisiones]], `EXPO_PUBLIC_AUTH_SIMULADO`).
**Diseño:** `notas/diseño-fuente/07-crear-cuenta.html`
**Archivos:** `src/screens/auth/RegisterScreen.tsx`
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Cabecera: volver + barra de 2 pasos + "1 de 2". Apodo (→ `nombre`), correo, contraseña con medidor de 4 segmentos y texto de fuerza. Tarjeta "Recordatorio diario" con Toggle → `preferencias.guardar`.
- Botón "Crear cuenta" → `register({nombre,email,password})`. Pie "¿Ya tienes cuenta? Inicia sesión".
- Omitido "Prefiero empezar sin cuenta".

## Hecho
- `src/screens/auth/RegisterScreen.tsx`: cabecera volver + barra de 2 pasos (`forest`/`border`) + "1 de 2"; titular "Crea tu espacio" y subtítulo con `asistente.nombre`; campos apodo (→ `nombre`, máx. 40), correo y contraseña con `MedidorContrasena`; tarjeta blanca radio 18 "Recordatorio diario" con `Toggle` (lee `preferencias.obtener()`, guarda al cambiar y otra vez antes de registrar); `ErrorApi` con el mensaje real; botón "Crear cuenta" (`loading`) → `register({nombre, email, password})`; pie "¿Ya tienes cuenta? Inicia sesión" → `popTo('Login')`.
- Validación: apodo obligatorio, correo válido, contraseña ≥ 6 (`validation.isValidPassword`). Ya no hay "Confirmar contraseña" (el diseño nuevo no lo tiene; el ojo permite revisarla).
- Medidor (`fuerzaContrasena`, 0–4, en `components/AuthBits.tsx`): <6 → "Muy corta"; desde 1, +1 por ≥10 caracteres, +1 por mayúsc.+minúsc., +1 por dígito y símbolo (+0,5 si solo uno). Colores: `dangerSolid` (1), `accent` (2), `moss` (3–4).

## Desviaciones del diseño
- Texto del medidor: "… · mínimo **6** caracteres" (el diseño dice 8) porque `utils/validation` y Supabase usan 6. Para subir a 8: cambiar `isValidPassword` y `PASSWORD_MIN` en `AuthBits.tsx`.
- "1 de 2": se muestra como en el diseño, pero no existe un paso 2 en este flujo (tras registrarse se entra directo a la app).
- Omitido "Prefiero empezar sin cuenta" (ver [[Decisiones]]).
- El nivel de fuerza solo aparece cuando hay algo escrito; vacío muestra solo "mínimo 6 caracteres".

> ✅ **Resuelto (2026-10-08):** el Splash desmontaba el formulario durante login/registro. `AuthContext.login/register` ya no activan `isLoading` (ver [[Decisiones]]).

## Revisión producción (2026-10-08)
- Doble envío: candado síncrono `enviando` (`useRef`) además de `loading`.
- Cadena de teclado: apodo (`next`, `nickname`, `autoCorrect={false}`, `words`) → correo (`email-address`, `none`, `emailAddress`) → contraseña (`go`, `new-password`/`newPassword`, `autoCorrect={false}`, `blurAndSubmit`) → envía. Los dos primeros con `submitBehavior="submit"` para no cerrar el teclado entre campos.
- Validación fallida: enfoca el primer campo con error (apodo → correo → contraseña) y vibra (`vibrarError`); también vibra ante error de la API. `Keyboard.dismiss()` al enviar.
- 360×640: `<Screen scroll keyboard>`; el formulario + tarjeta de recordatorio + botón se desplazan, el campo enfocado queda sobre el teclado; "Crear cuenta" alcanzable desplazando o con "Ir".

## Adaptación Android/iOS (2026-10-12)
- Compacto: huecos 16, padding superior 8, titular 27. En pantallas bajas el formulario se desplaza (es largo); el campo enfocado queda sobre el teclado.
