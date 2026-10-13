# Inicio

**Estado:** ✅ hecho
**Diseño:** `notas/diseño-fuente/02-inicio.html`
**Archivos:** `src/screens/inicio/InicioScreen.tsx` (+ usa `src/screens/actividades/actividadesUtils.ts`)
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Cabecera: fecha larga en español + saludo según hora (Buenos días/tardes/noches) + botón perfil (→ PerfilTab).
- Tarjeta "¿Cómo te sientes ahora?" con 5 opciones (`moodScale`), persiste con `animo.guardar`, carga `animo.deHoy()`.
- Dos tarjetas grandes: Escribir (ink) → Chat; Hablar (accent) → Voz. Textos con `asistente.nombre`.
- Fila "Tu registro semanal" → RegistroTab con resumen real de `diagnosticoService`.
- "Para hoy": actividades pendientes reales (`actividadesService.listar('pendientes')`, máx. 2, peach/sage) → Actividades; estado vacío si no hay.
- HelpButton bar al final.
- Scroll si no cabe; pull-to-refresh.

## Hecho
- `InicioScreen.tsx` reescrita fiel a `02-inicio.html`, tipada con `TabScreenProps<'InicioTab'>`.
- Cabecera: fecha larga ("Jueves, 8 de octubre") + saludo por hora (5–12 días, 12–19 tardes, resto noches) + primer nombre de `useAuth().user`; botón perfil salvia → `PerfilTab`.
- Check-in de ánimo: 5 opciones de `moodScale` (borde tinta 1.5 sobre crema al elegir); guarda con `animo.guardar` (optimista, revierte si falla) y carga `animo.deHoy()`.
- Tarjetas Escribir (ink → `Chat`) y Hablar (accent → `Voz`), 168 px, texto con `asistente.nombre`.
- "Tu registro semanal" → `RegistroTab`. Subtítulo real: `Último chequeo: <nivel> · <fecha relativa>`, o `Chequeo en curso · X de 17`, o `Aún sin chequeo completo`; + `ánimo N días` (de `animo.semanaActual()`). Estados de carga y error.
- "Para hoy": las 2 primeras pendientes ordenadas por `para_cuando` (peach/sage), cada una → `Actividades`; estado vacío y estado de error honestos.
- `HelpButton` bar al final (`marginTop: 'auto'`). Scroll + pull-to-refresh; recarga con `useFocusEffect`. Las cargas van en `Promise.allSettled`: un fallo no tumba el resto.

## Desviaciones del diseño
- Saludo con el primer nombre ("Buenas noches, Ana"); el diseño sólo dice "Buenas noches". El título admite 2 líneas.
- Enlace "Ver todo" junto a "Para hoy" (→ Actividades), para que la pantalla sea alcanzable aunque no haya pendientes.
- Subtítulos de "Para hoy" = `Categoría · para <fecha relativa>` (el diseño trae "2 min · antes de dormir", dato que el backend no tiene).
- Subtítulo del registro adaptado a Hamilton (el backend no tiene "notas nuevas").

## Revisión producción (2026-10-08)
- **Sin backend**: el ánimo (local, `@mood_log`) se carga aparte y al instante; ya no espera a que fallen las llamadas a la API. Actividades y chequeos se cargan en paralelo (`Promise.allSettled`) y cada fallo muestra su propio texto honesto. Si fallan los chequeos pero hay ánimo registrado, la fila dice `Chequeos sin conexión · ánimo N días` (dato real, local).
- Errores legibles: `mensajeDe` (en `actividadesUtils.ts`) se queda con el primer párrafo del error y descarta la coletilla técnica sobre Render.
- Guardar el ánimo: si falla AsyncStorage se revierte y se avisa con un Alert (antes fallaba en silencio).
- **Hápticos**: `haptico.seleccion()` al elegir un ánimo distinto (helper `haptico` en `actividadesUtils.ts`, nunca lanza en web).
- **Línea de ayuda**: `HelpButton` recibe `onPress` propio que hace `Linking.openURL('tel:113')` con `catch` → Alert con el número (`lineaAyuda.etiqueta`) si el dispositivo no puede llamar.
- Accesibilidad: las opciones de ánimo (`radio`) usan `accessibilityState.checked` (antes `selected`).
- Tab bar: no es absoluta, el contenido no queda tapado. Sin `console.log`.

## Adaptación Android/iOS (2026-10-12)
- Escribir/Hablar: `minHeight` 140 (bajo) / 152 (compacto) / `escala(168)`; crecen con fuente grande en vez de cortar.
- Check-in: en compacto padding 12, gap 4, orbe 24. "Muy mal"/"Muy bien" parten en 2 líneas; "Regular" se encoge (`adjustsFontSizeToFit`, `minimumFontScale 0.75`). Celdas alineadas arriba.
- Toques: `components/Tocable.tsx` (onda Android recortada al radio con `overflow: 'hidden'`, opacidad en iOS) en Escribir/Hablar, "Tu registro semanal", "Para hoy" y su estado vacío. Tokens `colors.ripple` / `rippleOnDark`.
- TabBar: alto de fila fijo (54), safe area inferior según plataforma (iOS `inset − 8`, Android `inset + 6`, 12 sin inset), pestañas centradas a 560 en tablets.
