import React, { useRef, useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';
import { Button, TextField, Txt } from '../../../components/ui';
import { asistente } from '../../../constants/asistente';
import { colors } from '../../../constants/colors';
import { Perfil, perfilService } from '../../../services/perfil';
import { mensajeDe } from '../../actividades/actividadesUtils';
import { Hoja } from './Hoja';

interface Props {
  visible: boolean;
  perfil: Perfil | null;
  onClose: () => void;
  onGuardado: (perfil: Perfil) => void;
}

type Campo = 'nombre' | 'edad' | 'ciudad' | 'ocupacion' | 'bio';

/** Edición de los datos que la asistente usa como memoria. */
export const EditarPerfilHoja: React.FC<Props> = ({ visible, ...resto }) => (
  <Hoja visible={visible} titulo="Editar perfil" onClose={resto.onClose}>
    {/* Se monta al abrir para partir siempre de los datos actuales. */}
    {visible && <Formulario {...resto} />}
  </Hoja>
);

const Formulario: React.FC<Omit<Props, 'visible'>> = ({ perfil, onClose, onGuardado }) => {
  const [borrador, setBorrador] = useState<Record<Campo, string>>(() => ({
    nombre: perfil?.nombre ?? '',
    edad: perfil?.edad ? String(perfil.edad) : '',
    ciudad: perfil?.ciudad ?? '',
    ocupacion: perfil?.ocupacion ?? '',
    bio: perfil?.bio ?? '',
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const edadRef = useRef<TextInput>(null);
  const ciudadRef = useRef<TextInput>(null);
  const ocupacionRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const cambiar = (campo: Campo) => (texto: string) =>
    setBorrador((b) => ({ ...b, [campo]: campo === 'edad' ? texto.replace(/\D/g, '') : texto }));

  const guardar = async () => {
    if (guardando) return;
    const edad = parseInt(borrador.edad, 10);
    if (borrador.edad && (!Number.isFinite(edad) || edad < 10 || edad > 120)) {
      setError('Escribe una edad entre 10 y 120 años.');
      edadRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setError(undefined);
    setGuardando(true);
    try {
      const actualizado = await perfilService.guardar({
        nombre: borrador.nombre.trim() || undefined,
        edad: Number.isFinite(edad) ? edad : undefined,
        ciudad: borrador.ciudad.trim() || undefined,
        ocupacion: borrador.ocupacion.trim() || undefined,
        bio: borrador.bio.trim() || undefined,
      });
      onGuardado(actualizado);
      onClose();
    } catch (e) {
      // La hoja sigue abierta con el borrador: no se pierde lo escrito.
      Alert.alert(
        'No se pudo guardar',
        `${mensajeDe(e)}\n\nLo que escribiste sigue aquí; inténtalo de nuevo en un momento.`
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Txt size={13.5} color={colors.inkSoft} leading={1.4}>
        {asistente.nombre} recordará lo que guardes aquí en sus próximas conversaciones contigo.
      </Txt>
      <TextField
        label="Cómo quieres que te llame"
        value={borrador.nombre}
        onChangeText={cambiar('nombre')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => edadRef.current?.focus()}
        maxLength={60}
      />
      <TextField
        ref={edadRef}
        label="Edad"
        value={borrador.edad}
        onChangeText={cambiar('edad')}
        keyboardType="number-pad"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => ciudadRef.current?.focus()}
        maxLength={3}
        error={error}
      />
      <TextField
        ref={ciudadRef}
        label="Ciudad"
        value={borrador.ciudad}
        onChangeText={cambiar('ciudad')}
        autoCapitalize="words"
        autoComplete="postal-address-locality"
        textContentType="addressCity"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => ocupacionRef.current?.focus()}
        maxLength={80}
      />
      <TextField
        ref={ocupacionRef}
        label="Qué estudias o a qué te dedicas"
        value={borrador.ocupacion}
        onChangeText={cambiar('ocupacion')}
        autoCapitalize="sentences"
        textContentType="jobTitle"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => bioRef.current?.focus()}
        maxLength={80}
      />
      <TextField
        ref={bioRef}
        label="Algo sobre ti"
        value={borrador.bio}
        onChangeText={cambiar('bio')}
        autoCapitalize="sentences"
        multiline
        maxLength={500}
        style={{ minHeight: 96 }}
      />
      <Button label="Guardar" onPress={guardar} loading={guardando} />
    </>
  );
};
