import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Screen,
  TextField,
  Title,
  Toggle,
  Txt,
} from '../../components/ui';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { asistente } from '../../constants/asistente';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../hooks/useLayout';
import { validation } from '../../utils/validation';
import { preferencias } from '../../utils/preferencias';
import { recordatorio as recordatorioService } from '../../services/recordatorio';
import type { RootScreenProps } from '../../navigation/types';
import { AvisoDespertando } from '../../components/AvisoDespertando';
import {
  EnlacePie,
  ErrorApi,
  MedidorContrasena,
  PASSWORD_MIN,
  vibrarError,
} from './components/AuthBits';

type Errores = { nombre?: string; email?: string; password?: string };

/** Barra de pasos "1 de 2" de la cabecera. */
const Pasos: React.FC<{ actual: number; total: number }> = ({ actual, total }) => (
  <View
    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    accessible
    accessibilityLabel={`Paso ${actual} de ${total}`}>
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < actual ? colors.forest : colors.border,
          }}
        />
      ))}
    </View>
    <Txt size={12.5} color={colors.inkSoft}>
      {actual} de {total}
    </Txt>
  </View>
);

/** Pantalla 7 · Crear cuenta. */
export const RegisterScreen: React.FC<RootScreenProps<'Register'>> = ({ navigation }) => {
  const { register } = useAuth();
  const { compacto } = useLayout();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordatorio, setRecordatorio] = useState(true);
  const [errores, setErrores] = useState<Errores>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nombreRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  // Candado síncrono contra doble envío (doble toque o Enter + botón).
  const enviando = useRef(false);

  useEffect(() => {
    let vivo = true;
    preferencias.obtener().then((p) => {
      if (vivo) setRecordatorio(p.recordatorioDiario);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const cambiarRecordatorio = (v: boolean) => {
    setRecordatorio(v);
    preferencias.guardar({ recordatorioDiario: v }).catch(() => {});
  };

  const limpiar = (campo: keyof Errores) => {
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const validar = () => {
    const next: Errores = {};
    if (!nombre.trim()) next.nombre = `Dinos cómo quieres que ${asistente.nombre} te llame`;
    if (!email.trim()) next.email = 'Escribe tu correo';
    else if (!validation.isValidEmail(email)) next.email = 'Ese correo no parece válido';
    if (!validation.isValidPassword(password))
      next.password = `Usa al menos ${PASSWORD_MIN} caracteres`;
    setErrores(next);
    if (next.nombre) nombreRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.password) passRef.current?.focus();
    return !next.nombre && !next.email && !next.password;
  };

  const crear = async () => {
    if (enviando.current) return;
    setErrorApi(null);
    if (!validar()) {
      vibrarError();
      return;
    }
    enviando.current = true;
    setLoading(true);
    Keyboard.dismiss();
    try {
      await preferencias.guardar({ recordatorioDiario: recordatorio }).catch(() => {});
      await register({ nombre: nombre.trim(), email: email.trim(), password });
      // La tarjeta "Recordatorio diario" ya explicó el motivo: con el toggle
      // activo se pide directamente el permiso del sistema y se programa.
      // Sin `await`: la app ya entra mientras sale el diálogo.
      if (recordatorio) {
        recordatorioService.pedirPermiso().then(() => recordatorioService.sincronizar());
      }
    } catch (err) {
      vibrarError();
      setErrorApi(
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos crear tu cuenta. Inténtalo de nuevo en un momento.'
      );
    } finally {
      enviando.current = false;
      setLoading(false);
    }
  };

  const volver = () =>
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Bienvenida');

  return (
    <Screen
      scroll
      keyboard
      padding={spacing.screenForm}
      gap={compacto ? 16 : 20}
      edges={['top', 'left', 'right', 'bottom']}
      contentStyle={{ paddingTop: compacto ? 8 : 16, paddingBottom: compacto ? 16 : 28 }}>
      {/* Cabecera: volver + pasos */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton
          name="back"
          accessibilityLabel="Volver"
          onPress={volver}
          style={{ marginLeft: -10 }}
        />
        <Pasos actual={1} total={2} />
      </View>

      <View style={{ gap: 8 }}>
        <Title size={compacto ? 27 : 30} tracking={-0.6} leading={1.1}>
          Crea tu espacio
        </Title>
        <Txt size={15} leading={1.45} color={colors.inkSoft}>
          No necesitas tu nombre real. Solo cómo quieres que {asistente.nombre} te llame.
        </Txt>
      </View>

      <View style={{ gap: 14 }}>
        <TextField
          ref={nombreRef}
          label="¿Cómo te llamo?"
          placeholder="Un apodo o tu nombre"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            limpiar('nombre');
          }}
          error={errores.nombre}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="nickname"
          textContentType="nickname"
          maxLength={40}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={emailRef}
          label="Correo"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            limpiar('email');
          }}
          error={errores.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          submitBehavior="submit"
        />
        <View style={{ gap: 6 }}>
          <TextField
            ref={passRef}
            label="Contraseña"
            password
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              limpiar('password');
            }}
            error={errores.password}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={crear}
            submitBehavior="blurAndSubmit"
          />
          <MedidorContrasena password={password} />
        </View>
      </View>

      <Card
        rounded={radius.lg}
        padding={14}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={14} weight="semibold">
            Recordatorio diario
          </Txt>
          <Txt size={12.5} color={colors.inkSoft}>
            {asistente.nombre} te pregunta cómo estás cada noche
          </Txt>
        </View>
        <Toggle
          value={recordatorio}
          onChange={cambiarRecordatorio}
          accessibilityLabel="Recordatorio diario"
        />
      </Card>

      <ErrorApi mensaje={errorApi} />

      <View style={{ marginTop: 'auto', gap: 12 }}>
        <Button label="Crear cuenta" loading={loading} onPress={crear} />
        <AvisoDespertando activo={loading} />
        <EnlacePie
          pregunta="¿Ya tienes cuenta?"
          accion="Inicia sesión"
          onPress={() => navigation.popTo('Login')}
        />
      </View>
    </Screen>
  );
};
