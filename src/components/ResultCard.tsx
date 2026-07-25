import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HamiltonResult } from '../types/chat';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { formatters } from '../utils/formatters';
import { GlassCard } from './GlassCard';

interface ResultCardProps {
  resultado: HamiltonResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ resultado }) => {
  const badgeColor = formatters.getSeverityColor(resultado.nivel);

  return (
    <GlassCard style={styles.card} glowColor={badgeColor}>
      {/* Level Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resultado de la Evaluación</Text>
        <View
          style={[styles.badge, { backgroundColor: `${badgeColor}18`, borderColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{resultado.nivel}</Text>
        </View>
      </View>

      {/* Score Circle */}
      <View style={styles.scoreContainer}>
        <View style={[styles.scoreBadge, { borderColor: badgeColor }]}>
          <Text style={styles.scoreNumber}>{resultado.score}</Text>
          <Text style={styles.scoreMax}>/ 52</Text>
        </View>
        <Text style={styles.scoreLabel}>Puntaje Total (Hamilton 17)</Text>
      </View>

      {/* Clinical Interpretation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interpretación Clínica</Text>
        <Text style={styles.interpretationText}>{resultado.interpretacion}</Text>
      </View>

      {/* Recommendations */}
      {resultado.recomendaciones && resultado.recomendaciones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recomendaciones Sugeridas</Text>
          {resultado.recomendaciones.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <Ionicons name="sparkles" size={12} color={colors.primary} style={styles.bullet} />
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.primary}
          style={styles.disclaimerIcon}
        />
        <Text style={styles.disclaimerText}>
          Este resultado es una herramienta de orientación psicoeducativa y NO constituye un
          diagnóstico clínico formal. Se recomienda compartirlo con un profesional de la salud
          mental.
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  scoreBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(241, 245, 249, 0.92)',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scoreMax: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scoreLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs + 2,
  },
  interpretationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  bullet: {
    marginRight: 8,
    marginTop: 2,
  },
  recText: {
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 1,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusSm,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    flexShrink: 1,
  },
});
