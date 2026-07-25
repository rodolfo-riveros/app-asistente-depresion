# Asistente Hamilton — React Native Expo App (Spatial UI Edition)

Aplicación móvil en **React Native + Expo** con diseño **Spatial UI / Cosmic Aesthetic** para conversaciones de acompañamiento emocional usando la Escala de Depresión de Hamilton (17 ítems).

---

## 🌟 Características Principales

1. **Diseño Spatial UI & Estética Cósmica**:
   - Fondo gradiente de espacio profundo con orbes de luz ambiental.
   - Tarjetas *Glassmorphic* translúcidas con bordes resplandecientes.
   - Avatar orbital con medallas de expresión emocional.
   - Indicador de escritura animado con pulso de luz.

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

La aplicación consume el backend FastAPI configurado en `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

- Endpoint principal: `POST /chat/mensaje`
- Endpoints de autenticación: `POST /auth/login`, `POST /auth/register`

> **Nota**: La app incluye un motor de *Mock Fallback local inteligente* de modo que si el servidor FastAPI no está corriendo, la app sigue funcionando al 100% permitiéndote probar la conversación completa, activar el protocolo de crisis y generar el informe sin ningún error.

---

## 📁 Estructura del Proyecto
# app-asistente-depresion
