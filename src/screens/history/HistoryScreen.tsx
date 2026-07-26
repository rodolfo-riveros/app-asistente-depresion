import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { formatters } from '../../utils/formatters';
import { storage } from '../../utils/storage';
import { api } from '../../services/api';
import { HamiltonResult } from '../../types/chat';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [history, setHistory] = useState<HamiltonResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fuente de verdad: el backend (Supabase). Si no hay red o la sesión venció,
   * se muestra la caché local de AsyncStorage para no dejar la pantalla vacía.
   */
  const loadHistory = useCallback(async (mostrarSpinner = true) => {
    // La caché se lee primero a propósito: así ningún setState ocurre de forma
    // síncrona al llamar esto desde un efecto.
    const cache = await storage.getHistory();
    if (mostrarSpinner) setRefreshing(true);

    try {
      const data = await api.getEvaluaciones();
      setHistory(data);
      setError(null);
    } catch (e) {
      setHistory(cache);
      setError(
        cache.length > 0
          ? 'Mostrando tu histórico guardado en este dispositivo (sin conexión al servidor).'
          : e instanceof Error
            ? e.message
            : 'No se pudo cargar tu histórico.'
      );
    } finally {
      if (mostrarSpinner) setRefreshing(false);
    }
  }, []);

  // Se recarga al entrar a la pestaña: si acabas de terminar una evaluación,
  // aparece aquí sin tener que hacer pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      loadHistory(false);
    }, [loadHistory])
  );

  const handleSelectItem = (item: HamiltonResult) => {
    navigation.navigate('ChatTab', {
      screen: 'Result',
      params: { resultado: item },
    });
  };

  return (
    <SpatialContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historial de Conversaciones</Text>
          <Text style={styles.subtitle}>
            Registro de tus momentos compartidos con Amiga Hamilton
          </Text>
        </View>

        {error ? (
          <View style={styles.noticeRow}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.textMuted} />
            <Text style={styles.noticeText}> {error}</Text>
          </View>
        ) : null}

        {history.length === 0 ? (
          <GlassCard style={styles.emptyCard} contentStyle={styles.emptyContent}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.primary} />
            <Text style={styles.emptyTitle}>Aún no hay conversaciones</Text>
            <Text style={styles.emptySub}>
              Inicia una conversación con Amiga Hamilton. Tus momentos compartidos aparecerán aquí.
            </Text>
          </GlassCard>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item, index) => item.sesion_id || index.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadHistory()}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const badgeColor = formatters.getSeverityColor(item.nivel);
              return (
                <Pressable
                  onPress={() => handleSelectItem(item)}
                  style={({ pressed }) => [{ width: '100%' }, pressed && { opacity: 0.85 }]}>
                  <GlassCard style={styles.historyCard} glowColor={badgeColor}>
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: `${badgeColor}22`, borderColor: badgeColor },
                        ]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{item.nivel}</Text>
                      </View>
                      <Text style={styles.dateText}>{formatters.formatDate(item.fecha)}</Text>
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreNum}>{item.score}</Text>
                        <Text style={styles.scoreSub}>pts</Text>
                      </View>
                      <Text style={styles.interpretText} numberOfLines={2}>
                        {item.interpretacion}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  noticeText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 100,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceInset,
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  scoreNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scoreSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: -2,
  },
  interpretText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
