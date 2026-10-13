import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { radius } from '../constants/spacing';
import { useAuth } from '../hooks/useAuth';
import { useLayout } from '../hooks/useLayout';
import { copiarNumero, llamar, toqueLigero } from '../screens/recursos/enlaces';
import { PersonaConfianza, preferencias } from '../utils/preferencias';
import { Button, Card, IconTile, Txt } from './ui';

/**
 * Contacto de confianza en crisis (v5).
 *
 * La app NO llama ni escribe sola: iOS y Android no lo permiten sin que la
 * persona toque, y además debe ser su decisión. Aquí sólo se lo ponemos a un
 * toque: "Llamar a {nombre}" y "Enviarle un mensaje" (WhatsApp con el texto ya
 * escrito; si no está, SMS; si tampoco, copiar el número).
 *
 * La persona de confianza vive sólo en el teléfono (`preferencias.personaConfianza`).
 * Si no hay ninguna, se ofrece añadirla en Perfil (se abre su hoja directamente).
 */

/** Número para wa.me: sólo dígitos; un móvil peruano de 9 dígitos lleva el 51 delante. */
export const numeroWhatsApp = (telefono: string): string => {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 9 && digitos.startsWith('9')) return `51${digitos}`;
  return digitos;
};

/** Mensaje preescrito, calmado y sin detalles (lo puede leer cualquiera en la pantalla). */
export const mensajeConfianza = (apodo?: string | null) => {
  const quien = apodo?.trim() ? `Hola, soy ${apodo.trim()}.` : 'Hola.';
  return `${quien} No me siento bien y me gustaría hablar contigo. ¿Puedes llamarme?`;
};

const urlSms = (telefono: string, texto: string) => {
  const numero = telefono.replace(/[^\d+]/g, '');
  // iOS separa el cuerpo con `&`, Android con `?`.
  const separador = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${numero}${separador}body=${encodeURIComponent(texto)}`;
};

const sinMensaje = (persona: PersonaConfianza) =>
  Alert.alert(
    'No se pudo abrir los mensajes',
    `Escríbele o llama a ${persona.nombre} al ${persona.telefono}.`,
    [
      { text: 'Copiar número', onPress: () => void copiarNumero(persona.telefono) },
      { text: 'Entendido', style: 'cancel' },
    ]
  );

const enviarSms = async (persona: PersonaConfianza, texto: string) => {
  try {
    await Linking.openURL(urlSms(persona.telefono, texto));
  } catch {
    sinMensaje(persona);
  }
};

/** WhatsApp con el texto escrito; si no se puede abrir, SMS; si tampoco, copiar. */
const enviarWhatsApp = async (persona: PersonaConfianza, texto: string) => {
  toqueLigero();
  const url = `https://wa.me/${numeroWhatsApp(persona.telefono)}?text=${encodeURIComponent(texto)}`;
  try {
    await Linking.openURL(url);
  } catch {
    await enviarSms(persona, texto);
  }
};

interface ContactoConfianzaProps {
  /** Título de la tarjeta (p. ej. el `titulo` de la acción del backend). */
  titulo?: string;
  /** Llamado antes de navegar a Perfil (p. ej. para cerrar un Modal). */
  onAntesDeNavegar?: () => void;
}

export const ContactoConfianza: React.FC<ContactoConfianzaProps> = ({
  titulo,
  onAntesDeNavegar,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { compacto, fontScale } = useLayout();
  const apilar = compacto || fontScale > 1.15;
  const [persona, setPersona] = useState<PersonaConfianza | null>(null);
  const [cargada, setCargada] = useState(false);

  // Se relee al volver a la pantalla (p. ej. tras añadirla en Perfil).
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      preferencias.obtener().then((p) => {
        if (!activo) return;
        setPersona(p.personaConfianza);
        setCargada(true);
      });
      return () => {
        activo = false;
      };
    }, [])
  );

  if (!cargada) return null;

  const anadir = () => {
    onAntesDeNavegar?.();
    navigation.navigate('MainApp', { screen: 'PerfilTab', params: { personaConfianza: true } });
  };

  const aviso = (
    <Txt size={12} color={colors.inkSoft} leading={1.4}>
      La app no llama ni escribe por ti: tú decides si quieres contactar a esta persona.
    </Txt>
  );

  if (!persona) {
    return (
      <Card
        rounded={radius.lg}
        padding={14}
        gap={10}
        style={{ borderWidth: 1, borderColor: colors.divider }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconTile
            name="user"
            bg={colors.peachPale}
            color={colors.ink}
            size={40}
            rounded={12}
            iconSize={18}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Txt size={14.5} weight="semibold">
              {titulo ?? 'Tu persona de confianza'}
            </Txt>
            <Txt size={12.5} color={colors.inkSoft} leading={1.35}>
              Guarda a alguien cercano para poder avisarle con un toque cuando lo necesites.
            </Txt>
          </View>
        </View>
        <Button
          label="Añadir persona de confianza"
          icon="plus"
          size="sm"
          variant="outline"
          onPress={anadir}
          accessibilityHint="Abre Perfil para guardar su nombre y teléfono"
        />
        {aviso}
      </Card>
    );
  }

  const texto = mensajeConfianza(user?.nombre);

  return (
    <Card
      rounded={radius.lg}
      padding={14}
      gap={10}
      style={{ borderWidth: 1, borderColor: colors.divider }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile
          name="heart"
          bg={colors.peachPale}
          color={colors.ink}
          size={40}
          rounded={12}
          iconSize={18}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Txt size={14.5} weight="semibold">
            {titulo ?? `Habla con ${persona.nombre}`}
          </Txt>
          <Txt size={12.5} color={colors.inkSoft} numberOfLines={1}>
            Tu persona de confianza · {persona.telefono}
          </Txt>
        </View>
      </View>
      <Button
        label={`Llamar a ${persona.nombre}`}
        icon="phone"
        size="md"
        onPress={() => llamar(persona.telefono)}
        accessibilityHint={`Abre el teléfono para llamar al ${persona.telefono}`}
      />
      <View style={{ flexDirection: apilar ? 'column' : 'row', gap: 8 }}>
        <Button
          label="Enviarle un mensaje"
          icon="chat"
          size="sm"
          variant="outline"
          grow={!apilar}
          onPress={() => enviarWhatsApp(persona, texto)}
          accessibilityHint={`Abre WhatsApp con el mensaje: ${texto}`}
        />
        <Button
          label="Por SMS"
          size="sm"
          variant="ghost"
          onPress={() => {
            toqueLigero();
            void enviarSms(persona, texto);
          }}
          accessibilityHint="Abre los mensajes del teléfono con el texto ya escrito"
        />
      </View>
      {aviso}
    </Card>
  );
};
