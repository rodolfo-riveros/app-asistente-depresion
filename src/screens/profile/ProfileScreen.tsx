import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { glassGlow } from '../../constants/glass';
import { useAuth } from '../../hooks/useAuth';
import { perfilService, Perfil } from '../../services/perfil';
import { Actividad, actividadesService } from '../../services/actividades';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [borrador, setBorrador] = useState({
    nombre: '',
    edad: '',
    ciudad: '',
    ocupacion: '',
    bio: '',
  });

  const cargar = useCallback(async () => {
    const [p, a] = await Promise.all([
      perfilService.obtener().catch(() => null),
      actividadesService.listar('pendientes').catch(() => [] as Actividad[]),
    ]);
    if (p) {
      setPerfil(p);
      setBorrador({
        nombre: p.nombre ?? '',
        edad: p.edad ? String(p.edad) : '',
        ciudad: p.ciudad ?? '',
        ocupacion: p.ocupacion ?? '',
        bio: p.bio ?? '',
      });
    }
    setActividades(a);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesito acceso a tus fotos para cambiar tu imagen.');
      return;
    }

    const elegida = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (elegida.canceled || !elegida.assets?.[0]?.uri) return;

    setSubiendoFoto(true);
    try {
      setPerfil(await perfilService.subirFoto(elegida.assets[0].uri));
    } catch (e) {
      Alert.alert('No se pudo subir', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const edad = parseInt(borrador.edad, 10);
      setPerfil(
        await perfilService.guardar({
          nombre: borrador.nombre.trim() || undefined,
          edad: Number.isFinite(edad) ? edad : undefined,
          ciudad: borrador.ciudad.trim() || undefined,
          ocupacion: borrador.ocupacion.trim() || undefined,
          bio: borrador.bio.trim() || undefined,
        })
      );
      setEditando(false);
    } catch (e) {
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCompletar = async (actividad: Actividad) => {
    setActividades((prev) => prev.filter((a) => a.id !== actividad.id));
    try {
      await actividadesService.completar(actividad.id, true);
    } catch {
      cargar();
    }
  };

  const nombre = perfil?.nombre || user?.nombre || 'Tu espacio seguro';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <SpatialContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <Pressable
            onPress={handleFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            style={styles.avatarBig}>
            {perfil?.foto_url ? (
              <Image source={{ uri: perfil.foto_url }} style={styles.avatarImagen} />
            ) : (
              <Text style={styles.avatarInitial}>{inicial}</Text>
            )}
            <View style={styles.camara}>
              {subiendoFoto ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              )}
            </View>
          </Pressable>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userEmail}>{perfil?.email || user?.email || ''}</Text>
          {perfil?.ciudad || perfil?.ocupacion ? (
            <Text style={styles.userMeta}>
              {[perfil?.ocupacion, perfil?.ciudad].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* Datos personales — el asistente los usa para acompañarte mejor */}
        <GlassCard
          level="low"
          radius={spacing.borderRadiusSm}
          style={styles.sectionCard}
          contentStyle={styles.sectionCardContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sobre ti</Text>
            <Pressable
              onPress={() => setEditando((v) => !v)}
              accessibilityRole="button"
              hitSlop={8}>
              <Ionicons
                name={editando ? 'close' : 'create-outline'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {editando ? (
            <>
              <AuthInput
                label="Nombre"
                value={borrador.nombre}
                onChangeText={(t) => setBorrador((b) => ({ ...b, nombre: t }))}
              />
              <AuthInput
                label="Edad"
                value={borrador.edad}
                keyboardType="number-pad"
                onChangeText={(t) => setBorrador((b) => ({ ...b, edad: t.replace(/\D/g, '') }))}
              />
              <AuthInput
                label="Ciudad"
                value={borrador.ciudad}
                onChangeText={(t) => setBorrador((b) => ({ ...b, ciudad: t }))}
              />
              <AuthInput
                label="Qué estudias o a qué te dedicas"
                value={borrador.ocupacion}
                onChangeText={(t) => setBorrador((b) => ({ ...b, ocupacion: t }))}
              />
              <AuthInput
                label="Algo sobre ti"
                value={borrador.bio}
                multiline
                onChangeText={(t) => setBorrador((b) => ({ ...b, bio: t }))}
              />
              <AuthButton label="Guardar" loading={guardando} onPress={handleGuardar} />
            </>
          ) : (
            <Text style={styles.bioText}>
              {perfil?.bio?.trim() ||
                'Cuéntale al asistente quién eres: lo que guardes aquí lo recordará en sus próximas conversaciones contigo.'}
            </Text>
          )}
        </GlassCard>

        {/* Planes acordados en el chat */}
        {actividades.length > 0 && (
          <GlassCard
            level="low"
            radius={spacing.borderRadiusSm}
            style={styles.sectionCard}
            contentStyle={styles.sectionCardContent}>
            <Text style={styles.sectionTitle}>Lo que acordaste</Text>
            {actividades.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => handleCompletar(a)}
                accessibilityRole="checkbox"
                accessibilityLabel={`Marcar como hecho: ${a.titulo}`}
                style={({ pressed }) => [styles.actividadRow, pressed && { opacity: 0.7 }]}>
                <Ionicons name="ellipse-outline" size={18} color={colors.primary} />
                <View style={styles.actividadTexto}>
                  <Text style={styles.actividadTitulo}>{a.titulo}</Text>
                  {a.nota ? <Text style={styles.actividadNota}>{a.nota}</Text> : null}
                </View>
              </Pressable>
            ))}
          </GlassCard>
        )}

        <GlassCard
          level="low"
          radius={spacing.borderRadiusSm}
          style={styles.sectionCard}
          contentStyle={styles.sectionCardContent}>
          <Text style={styles.sectionTitle}>Líneas de Emergencia</Text>
          <View style={styles.emergencyRow}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.emergencyItem}> Línea 113 Opción 5 (Atención 24/7)</Text>
          </View>
          <View style={styles.emergencyRow}>
            <Ionicons name="medkit-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.emergencyItem}> SAMU 106 (Urgencias)</Text>
          </View>
          <View style={styles.emergencyRow}>
            <Ionicons name="business-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.emergencyItem}> CSMC Wanchaq (Cusco)</Text>
          </View>
        </GlassCard>

        <AuthButton variant="danger" label="Cerrar Sesión" onPress={handleLogout} />
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryContainer,
    borderColor: colors.glassBorderActive,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    overflow: 'visible',
    ...glassGlow(colors.primary, 20),
  },
  avatarImagen: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  camara: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryStrong ?? colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionCardContent: {
    padding: 20,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  actividadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  actividadTexto: {
    flex: 1,
  },
  actividadTitulo: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  actividadNota: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyItem: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
