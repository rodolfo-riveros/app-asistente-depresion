# Asistente Hamilton — React Native Expo App (Glassmorphism Edition)

Aplicación móvil en **React Native + Expo** con diseño **glassmorphism** y paleta *Verde agua / teal claro* para conversaciones de acompañamiento emocional usando la Escala de Depresión de Hamilton (17 ítems).

---

## 🌟 Características Principales

1. **Diseño Glassmorphism (paleta "Verde agua / teal claro")**:
   - Lienzo verde agua claro (`#EDF4F3`) con degradados de luz difusa, sin orbes ni formas decorativas.
   - Superficies de cristal reales (blur + tinte blanco + borde luminoso + hairline) vía el componente `Glass`.
   - Acento teal profundo (`#35786F`) y apoyo azul acero (`#46728A`); severidad teal → azul → ámbar → rojo.
   - Texto con contraste AA (≥ 4.5:1) sobre el fondo en todos los niveles.

2. **Autenticación Segura**:
   - Registro e inicio de sesión con nombre completo, correo electrónico y contraseña.
   - Persistencia de token JWT en `@react-native-async-storage/async-storage`.

3. **Chat Conversacional Hamilton (17 Ítems)**:
   - Flujo natural y empático de preguntas.
   - Entrada multitexto cómoda, autoscroll al último mensaje.
   - Detección de estados de ánimo y finalización automática de la conversación.

4. **Protocolo de Crisis Inmediato**:
   - Intervención calmante.
   - Botón directo para copiar/llamar a la **Línea 113 (Opción 5)** de atención psicológica 24/7.
   - Botón directo para llamar a **SAMU 106** para emergencias médicas.
   - Búsqueda de **Centros de Salud Mental Comunitarios en Cusco** con integración a Google Maps y llamada directa.

5. **Informe de Conversación & Histórico**:
   - Visualización holográfica de la conversación.
   - Guardado automático en el historial local y opción para compartir resumen.

---

## 🚀 Instalación y Ejecución

### 1. Requisitos Previos
- Node.js (versión 18 o superior)
- App Expo Go en tu smartphone Android/iOS o emulador instalado.

### 2. Iniciar la aplicación
```bash
# Iniciar servidor de desarrollo de Expo
npx expo start

# O para web
npm run web
```

Escanea el código QR con la app **Expo Go** en tu celular o presiona `a` para emulador Android / `i` para iOS.

---

## 🌐 Conexión con Backend FastAPI

La aplicación consume el backend FastAPI (`asistente-hamilton-backend`), que a su
vez persiste todo en **Supabase**. URL configurable en `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000   # 10.0.2.2 en emulador Android; IP LAN en dispositivo físico
```

| Endpoint | Uso |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Cuentas (Supabase Auth vía backend). Devuelven `{token, user}` |
| `POST /chat/mensaje` | Conversación; trae `resultado` cuando el test termina |
| `GET /evaluaciones` | Histórico del usuario autenticado |
| `GET /salud` | Health check |

El `token` viaja en `Authorization: Bearer` en todas las llamadas. Un `401`
cierra la sesión local automáticamente.

> **Requiere el backend corriendo.** Ya no hay motor mock local: si el servidor
> no responde, la app muestra el error real (por ejemplo, "No se pudo conectar
> con el servidor") en vez de simular la conversación. El único dato que
> sobrevive sin conexión es la caché local del histórico.

---

## 📁 Estructura del Proyecto
# app-asistente-depresion
