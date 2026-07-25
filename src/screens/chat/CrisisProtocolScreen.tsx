import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { CUSCO_HEALTH_CENTERS, locationService } from '../../services/location';
import { MentalHealthCenter } from '../../types/chat';

export const CrisisProtocolScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [centers, setCenters] = useState<MentalHealthCenter[]>(CUSCO_HEALTH_CENTERS);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Llamada', `Inicia la llamada marcando al ${number}`);
    });
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', `Número ${text} copiado al portapapeles.`);
  };

  const handleOpenMap = (center: MentalHealthCenter) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lon}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Mapa', `No se pudo abrir el mapa para ${center.nombre}`);
    });
  };

  const handleRequestLocation = async () => {
    setLoadingLoc(true);
    const loc = await locationService.getCurrentLocation();
    setLoadingLoc(false);
    if (loc) {
      Alert.alert(
        'Ubicación obtenida',
        'Mostrando centros de salud mental cercanos a ti en Cusco.'
      );
    } else {
      Alert.alert('Ubicación no disponible', 'Mostrando lista general de centros en Cusco.');
    }
  };

  return (
    <SpatialContainer variant="crisis">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="heart" size={14} color={colors.danger} />
          <Text style={styles.badgeText}> Protocolo de Acompañamiento Prioritario</Text>
          <Text style={styles.title}>Queremos Ayudarte</Text>
          <Text style={styles.subtitle}>
            Tu vida y tu bienestar son invaluables. Si estás pasando por un momento muy difícil o
            abrumador, por favor conecta con estas líneas de apoyo inmediato.
          </Text>
        </View>

        {/* Guaranteed Line 113 */}
        <GlassCard style={styles.hotlineCard} glowColor={colors.dangerBorder}>
          <View style={styles.hotlineHeader}>
            <Ionicons name="call-outline" size={24} color={colors.accent} />
            <View style={styles.hotlineTitles}>
              <Text style={styles.hotlineName}>Línea 113 (Opción 5)</Text>
              <Text style={styles.hotlineSub}>MINSA Perú • Orientación Psicológica 24/7</Text>
            </View>
          </View>
          <Text style={styles.hotlineDesc}>
            Servicio gratuito de contención emocional, atención en crisis y salud mental atendido
            por psicólogos del Estado.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleCopy('113')}>
              <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.copyBtnText}> Copiar 113</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleCall('113')}>
              <Ionicons name="call-outline" size={16} color={colors.onPrimary} />
              <Text style={styles.callBtnText}> Llamar Gratis al 113</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Emergency SAMU 106 */}
        <GlassCard style={styles.hotlineCard} glowColor={colors.warning}>
          <View style={styles.hotlineHeader}>
            <Ionicons name="medkit-outline" size={24} color={colors.warning} />
            <View style={styles.hotlineTitles}>
              <Text style={styles.hotlineName}>SAMU 106</Text>
              <Text style={styles.hotlineSub}>Sistema de Atención Médica de Urgencia</Text>
            </View>
          </View>
          <Text style={styles.hotlineDesc}>
            Atención médica de emergencia las 24 horas frente a situaciones de riesgo de vida
            inmediato.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={({ pressed }) => [styles.callBtnWarning, pressed && { opacity: 0.85 }]}
              onPress={() => handleCall('106')}>
              <Ionicons name="call-outline" size={16} color={colors.onPrimary} />
              <Text style={styles.callBtnWarningText}> Llamar 106</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* Nearby Health Centers Cusco */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Centros de Salud Mental en Cusco</Text>
          <Pressable
            style={({ pressed }) => [styles.gpsBtn, pressed && { opacity: 0.8 }]}
            onPress={handleRequestLocation}
            disabled={loadingLoc}>
            {!loadingLoc && <Ionicons name="location-outline" size={14} color={colors.primary} />}
            <Text style={styles.gpsBtnText}>{loadingLoc ? 'Buscando...' : ' Usar GPS'}</Text>
          </Pressable>
        </View>

        {centers.map((c) => (
          <GlassCard key={c.id} style={styles.centerCard}>
            <Text style={styles.centerTitle}>{c.nombre}</Text>
            <View style={styles.centerRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.centerAddress}> {c.direccion}</Text>
            </View>
            <View style={styles.centerRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.centerHours}> {c.horario}</Text>
            </View>

            <View style={styles.centerBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.centerCallBtn, pressed && { opacity: 0.85 }]}
                onPress={() => handleCall(c.telefono)}>
                <Ionicons name="call-outline" size={14} color={colors.accent} />
                <Text style={styles.centerCallBtnText}> {c.telefono}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.centerMapBtn, pressed && { opacity: 0.85 }]}
                onPress={() => handleOpenMap(c)}>
                <Ionicons name="map-outline" size={14} color={colors.primary} />
                <Text style={styles.centerMapBtnText}> Cómo Llegar</Text>
              </Pressable>
            </View>
          </GlassCard>
        ))}

        {/* Return to Chat */}
        <Pressable
          style={({ pressed }) => [styles.returnBtn, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.returnBtnText}>Volver al chat</Text>
        </Pressable>
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  badgeText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  hotlineCard: {
    marginBottom: spacing.md,
  },
  hotlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hotlineIcon: {
    marginRight: spacing.sm,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  hotlineTitles: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  hotlineSub: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  hotlineDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
    marginRight: 8,
  },
  copyBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  callBtnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSm,
  },
  callBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  gpsBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerCard: {
    marginBottom: spacing.sm,
  },
  centerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  centerAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  centerHours: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  centerBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  centerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: colors.accent,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  centerCallBtnText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 13,
  },
  centerMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 6,
    justifyContent: 'center',
  },
  centerMapBtnText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  returnBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusSm,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  callBtnWarningText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  returnBtnText: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
