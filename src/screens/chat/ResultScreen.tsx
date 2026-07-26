import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpatialContainer } from '../../components/SpatialContainer';
import { ResultCard } from '../../components/ResultCard';
import { AuthButton } from '../../components/AuthButton';
import { Glass } from '../../components/Glass';
import { colors } from '../../constants/colors';
import { asistente } from '../../constants/asistente';
import { spacing } from '../../constants/spacing';
import { useChat } from '../../hooks/useChat';
import { storage } from '../../utils/storage';

const pressableBase = { flex: 1 };

export const ResultScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { resetChat } = useChat();
  const resultado = route.params?.resultado;

  if (!resultado) {
    return (
      <SpatialContainer style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay un resultado disponible para mostrar.</Text>
        <AuthButton label="Volver al Chat" onPress={() => navigation.navigate('ChatMain')} />
      </SpatialContainer>
    );
  }

  const handleShare = async () => {
    try {
      const shareMessage = `Resumen de mi evaluación (${asistente.nombre}):\nNivel: ${resultado.nivel}\nPuntaje: ${resultado.score}/52\nFecha: ${new Date(resultado.fecha).toLocaleDateString()}\n\nInterpretación: ${resultado.interpretacion}`;
      await Share.share({
        message: shareMessage,
        title: 'Resumen de mi evaluación',
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
          <View style={styles.headerBadge}>
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.accent} />
            <Text style={styles.headerBadgeText}> Conversación Completada</Text>
          </View>

          <Text style={styles.title}>Resumen de tu Conversación</Text>
          <Text style={styles.subtitle}>
            Gracias por compartir lo que sientes con {asistente.nombre}. Aquí hay un resumen de lo
            conversado.
          </Text>
        </View>

        {/* Detailed Result Card */}
        <ResultCard resultado={resultado} />

        {/* Interactive Action Buttons */}
        <View style={styles.actionsContainer}>
          <AuthButton label="Realizar otra evaluación" onPress={handleRestart} style={styles.cta} />

          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [pressableBase, pressed && { opacity: 0.85 }]}
              onPress={handleShare}>
              <Glass level="low" contentStyle={styles.btnSecondaryContent}>
                <Ionicons name="share-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.btnSecondaryText}> Compartir</Text>
              </Glass>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [pressableBase, pressed && { opacity: 0.85 }]}
              onPress={handleSave}>
              <Glass level="low" contentStyle={styles.btnSecondaryContent}>
                <Ionicons name="download-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.btnSecondaryText}> Guardar</Text>
              </Glass>
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
    paddingBottom: 100,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: spacing.sm,
  },
  headerBadgeText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
    lineHeight: 19,
  },
  actionsContainer: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: 0,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  btnSecondaryContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 6,
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
