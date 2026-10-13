# Resultado y Crisis

**Estado:** ⏳ pendiente
**Diseño:** `notas/diseño-fuente/(sin diseño propio)`
**Archivos:** ver [[Registro]] (Result) y [[Recursos]] (CrisisProtocol)
**Contexto:** [[Rediseño Aliento]] · [[Decisiones]]

## Requisitos
- Result lo hace el agente de Registro; CrisisProtocol el de Recursos.

## Hecho
_(lo rellena quien implemente: qué se hizo, archivos tocados)_

## Desviaciones del diseño
_(qué no se reprodujo igual y por qué)_

## v5 (2026-10-13)
Ver [[Chat v5 y build]].
- **Contacto de confianza** (`components/ContactoConfianza.tsx`) arriba en `CrisisProtocolScreen` y en `CrisisAlert`: "Llamar a {nombre}", "Enviarle un mensaje" (WhatsApp con texto preescrito → SMS → copiar número) y "Por SMS"; sin persona guardada, "Añadir persona de confianza" → Perfil con la hoja abierta. Texto: la app no llama ni escribe sola, la persona decide (iOS/Android no lo permiten y requiere consentimiento).
- `ResultScreen` no genera PDF (sólo Registro).
