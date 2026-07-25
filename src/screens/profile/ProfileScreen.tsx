import React from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { AuthButton } from '../../components/AuthButton';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useAuth } from '../../hooks/useAuth';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SpatialContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarInitial}>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'E'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.nombre || 'Tu espacio seguro'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'tu@espacio.com'}</Text>
        </View>

        {/* Account Details GlassCard */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado de Cuenta</Text>
            <View style={styles.verifiedChip}>
              <Ionicons name="checkmark" size={14} color={colors.accent} />
              <Text style={styles.verifiedText}> Verificado</Text>
            </View>
          </View>
        </GlassCard>

        {/* Emergency Helplines Card */}
        <GlassCard style={styles.sectionCard} glowColor={colors.glassBorder}>
          <Text style={styles.sectionTitle}>Líneas de Emergencia</Text>
          <View style={styles.emergencyRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
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

        {/* Logout Button */}
        <AuthButton label="Cerrar Sesión" onPress={handleLogout} style={styles.logoutBtn} />
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: colors.primary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
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
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
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
  logoutBtn: {
    backgroundColor: colors.danger,
    marginTop: spacing.lg,
  },
});
