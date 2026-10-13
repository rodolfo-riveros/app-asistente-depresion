import React, { useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { Button, IconButton, LogoMark, Screen, TextField, Title, Txt } from '../../components/ui';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { asistente } from '../../constants/asistente';
import { useAuth } from '../../hooks/useAuth';
import { useLayout } from '../../hooks/useLayout';
import { validation } from '../../utils/validation';
import type { RootScreenProps } from '../../navigation/types';
import { AvisoDespertando } from '../../components/AvisoDespertando';
import { EnlacePie, ErrorApi, PASSWORD_MIN, vibrarError } from './components/AuthBits';

type Errores = { email?: string; password?: string };

/** Pantalla 6 · Login. */
export const LoginScreen: React.FC<RootScreenProps<'Login'>> = ({ navigation }) => {
  const { login } = useAuth();
  const { compacto } = useLayout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  // Candado síncrono: un doble toque o el Enter del teclado no envían dos veces
  // aunque `loading` aún no se haya renderizado.
  const enviando = useRef(false);

  const validar = () => {
    const next: Errores = {};
    if (!email.trim()) next.email = 'Escribe tu correo';
    else if (!validation.isValidEmail(email)) next.email = 'Ese correo no parece válido';
    if (!password) next.password = 'Escribe tu contraseña';
    else if (!validation.isValidPassword(password))
      next.password = `La contraseña tiene al menos ${PASSWORD_MIN} caracteres`;
    setErrores(next);
    if (next.email) emailRef.current?.focus();
    else if (next.password) passRef.current?.focus();
    return !next.email && !next.password;
  };

  const entrar = async () => {
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
      await login({ email: email.trim(), password });
    } catch (err) {
      vibrarError();
      setErrorApi(
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos iniciar sesión. Revisa tu correo y contraseña.'
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
      gap={compacto ? 16 : 22}
      edges={['top', 'left', 'right', 'bottom']}
      contentStyle={{ paddingTop: compacto ? 8 : 16, paddingBottom: compacto ? 16 : 28 }}>
      <IconButton
        name="back"
        accessibilityLabel="Volver"
        onPress={volver}
        style={{ marginLeft: -10 }}
      />

      <View style={{ gap: compacto ? 10 : 14 }}>
        <LogoMark size={compacto ? 40 : 48} />
        <Title size={compacto ? 27 : 30} tracking={-0.6} leading={1.1}>
          {'Qué bueno\nverte de nuevo'}
        </Title>
        <Txt size={15} leading={1.45} color={colors.inkSoft}>
          {asistente.nombre} recuerda dónde se quedaron. Entra para continuar.
        </Txt>
      </View>

      <View style={{ gap: 14 }}>
        <TextField
          ref={emailRef}
          label="Correo"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errores.email) setErrores((e) => ({ ...e, email: undefined }));
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
        <TextField
          ref={passRef}
          label="Contraseña"
          password
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errores.password) setErrores((e) => ({ ...e, password: undefined }));
          }}
          error={errores.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={entrar}
          submitBehavior="blurAndSubmit"
        />
        <ErrorApi mensaje={errorApi} />
      </View>

      <Button label="Entrar" loading={loading} onPress={entrar} />
      <AvisoDespertando activo={loading} />

      <View style={{ marginTop: 'auto' }}>
        <EnlacePie
          pregunta="¿Aún no tienes cuenta?"
          accion="Crear una"
          onPress={() => navigation.popTo('Register')}
        />
      </View>
    </Screen>
  );
};
