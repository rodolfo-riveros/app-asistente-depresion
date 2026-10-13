import React, { useRef, useState } from 'react';
import { Alert, Keyboard, TextInput } from 'react-native';
import { Button, TextField, Txt } from '../../../components/ui';
import { colors } from '../../../constants/colors';
import { PersonaConfianza } from '../../../utils/preferencias';
import { Hoja } from './Hoja';

interface Props {
  visible: boolean;
  persona: PersonaConfianza | null;
  onClose: () => void;
  onGuardar: (persona: PersonaConfianza | null) => Promise<void>;
}

/** Alta / cambio / borrado de la persona de confianza (sólo en el dispositivo). */
export const PersonaConfianzaHoja: React.FC<Props> = ({ visible, ...resto }) => (
  <Hoja visible={visible} titulo="Persona de confianza" onClose={resto.onClose}>
    {/* Se monta al abrir para partir siempre de lo guardado. */}
    {visible && <Formulario {...resto} />}
  </Hoja>
);

const Formulario: React.FC<Omit<Props, 'visible'>> = ({ persona, onClose, onGuardar }) => {
  const [nombre, setNombre] = useState(persona?.nombre ?? '');
  const [telefono, setTelefono] = useState(persona?.telefono ?? '');
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string }>({});
  const [guardando, setGuardando] = useState(false);
  const telefonoRef = useRef<TextInput>(null);

  const ejecutar = async (valor: PersonaConfianza | null) => {
    setGuardando(true);
    try {
      await onGuardar(valor);
      onClose();
    } catch {
      Alert.alert(
        'No se pudo guardar',
        'No se pudo escribir en este teléfono. Inténtalo de nuevo.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardar = () => {
    if (guardando) return;
    const limpio = telefono.replace(/[^\d+]/g, '');
    const nuevos = {
      nombre: nombre.trim() ? undefined : 'Escribe su nombre.',
      telefono: limpio.replace(/\D/g, '').length >= 6 ? undefined : 'Escribe un teléfono válido.',
    };
    setErrores(nuevos);
    if (nuevos.nombre || nuevos.telefono) return;
    Keyboard.dismiss();
    ejecutar({ nombre: nombre.trim(), telefono: limpio });
  };

  const quitar = () =>
    Alert.alert('Quitar persona de confianza', `¿Quitar a ${persona?.nombre ?? 'esta persona'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => ejecutar(null) },
    ]);

  return (
    <>
      <Txt size={13.5} color={colors.inkSoft} leading={1.4}>
        Alguien a quien puedas llamar con un toque si lo necesitas. Se guarda sólo en este teléfono.
      </Txt>
      <TextField
        label="Nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => telefonoRef.current?.focus()}
        placeholder="Ej. Mi hermana"
        maxLength={60}
        error={errores.nombre}
      />
      <TextField
        ref={telefonoRef}
        label="Teléfono"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="done"
        onSubmitEditing={guardar}
        placeholder="Ej. 984 123 456"
        maxLength={20}
        error={errores.telefono}
      />
      <Button label="Guardar" onPress={guardar} loading={guardando} />
      {persona && <Button label="Quitar" variant="danger" onPress={quitar} disabled={guardando} />}
    </>
  );
};
