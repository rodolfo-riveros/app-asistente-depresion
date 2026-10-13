# Índice — Asistente (app móvil)

> **Regla de trabajo:** antes de tocar código, lee [[Rediseño Aliento]] y la nota de la pantalla que vas a cambiar en `pantallas/`. Después de cada cambio, actualiza esa nota (estado + qué se hizo) y añade una línea en [[Bitácora]].

## Notas
- [[Rediseño Aliento]] — plan maestro: tokens, primitivas, navegación, mapeo pantalla ↔ datos.
- [[Decisiones]] — decisiones tomadas y por qué (nombres, funciones omitidas, etc.).
- [[Bitácora]] — registro cronológico de cambios.
- [[Producción móvil]] — revisión para publicar: teclado, permisos, config nativa, checklist.
- [[Notificaciones y voz]] — recordatorio diario (notificación local) y voz femenina calmada (teléfono + nube vía backend).
- [[Integración backend y adaptación]] — backend real (contratos, /voz/sintetizar) y diseño adaptable a Android/iOS (tamaños, tablets, fuente del sistema).

## Pantallas
| # | Pantalla | Nota | Estado |
|---|---|---|---|
| 1 | Bienvenida | [[Bienvenida]] | ver nota |
| 2 | Inicio | [[Inicio]] | ver nota |
| 3 | Chat | [[Chat]] | ver nota |
| 4 | Modo voz | [[Voz]] | ver nota |
| 5 | Registro de bienestar | [[Registro]] | ver nota |
| 6 | Iniciar sesión | [[Login]] | ver nota |
| 7 | Crear cuenta | [[Crear cuenta]] | ver nota |
| 8 | Recursos | [[Recursos]] | ver nota |
| 9 | Perfil | [[Perfil]] | ver nota |
| — | Actividades (apoyo) | [[Actividades]] | ver nota |
| — | Resultado / Crisis (apoyo) | [[Resultado y Crisis]] | ver nota |

## Fuente del diseño
`notas/diseño-fuente/*.html` — HTML original exportado de Claude Design (`Aliento — app de acompañamiento.html`), una pantalla por archivo, 390×844. Es la referencia visual exacta (colores, tamaños, radios, textos).
