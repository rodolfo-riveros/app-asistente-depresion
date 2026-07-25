import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpatialContainer } from '../../components/SpatialContainer';
import { ResultCard } from '../../components/ResultCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { storage } from '../../utils/storage';

export const ResultScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { resetChat } = useChat();
  const { isAuthenticated } = useAuth();
  const resultado = route.params?.resultado;

  if (!resultado) {
    return (
      <SpatialContainer style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay un resultado disponible para mostrar.</Text>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('ChatMain')}>
          <Text style={styles.btnText}>Volver al Chat</Text>
        </Pressable>
      </SpatialContainer>
    );
  }

  const handleShare = async () => {
    try {
      const shareMessage = `Resumen de Evaluación - Asistente Hamilton:\nNivel: ${resultado.nivel}\nPuntaje: ${resultado.score}/52\nFecha: ${new Date(resultado.fecha).toLocaleDateString()}\n\nInterpretación: ${resultado.interpretacion}`;
      await Share.share({
        message: shareMessage,
        title: 'Resultado de Evaluación Hamilton',
      });
    } catch (e) {
      console.error('Error sharing result:', e);
    }
  };

  const handleSave = async () => {
    await storage.saveEvaluation(resultado);
    Alert.alert('Guardado', 'Tu evaluación ha sido guardada en tu historial local.');
  };

  const handleRestart = () => {
    resetChat();
    navigation.navigate('ChatMain');
  };

  return (
    <SpatialContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={12} color={colors.primary} />
          <Text style={styles.headerBadgeText}> Conversación Completada</Text>

          <Text style={styles.title}>Resumen de tu Conversación</Text>
          <Text style={styles.subtitle}>
            Gracias por compartir lo que sientes con Amiga Hamilton. Aquí hay un resumen de lo
            conversado.
          </Text>
        </View>

        {/* Detailed Result Card */}
        <ResultCard resultado={resultado} />

        {/* Interactive Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={handleRestart}>
            <Ionicons name="refresh-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.btnPrimaryText}> Realizar otra evaluación</Text>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
              onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.btnSecondaryText}> Compartir</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.8 }]}
              onPress={handleSave}>
              <Ionicons name="save-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.btnSecondaryText}> Guardar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  headerBadgeText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  btnPrimary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: spacing.borderRadiusSm,
    marginBottom: spacing.sm,
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  btnSecondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: spacing.borderRadiusSm,
    marginHorizontal: 4,
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
