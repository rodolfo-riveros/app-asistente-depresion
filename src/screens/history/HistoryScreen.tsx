import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpatialContainer } from '../../components/SpatialContainer';
import { GlassCard } from '../../components/GlassCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { formatters } from '../../utils/formatters';
import { storage } from '../../utils/storage';
import { HamiltonResult } from '../../types/chat';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [history, setHistory] = useState<HamiltonResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    setRefreshing(true);
    const data = await storage.getHistory();
    setHistory(data);
    setRefreshing(false);
  };

  useEffect(() => {
    storage.getHistory().then(setHistory);
  }, []);

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

        {history.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
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
                onRefresh={loadHistory}
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
                          { backgroundColor: `${badgeColor}15`, borderColor: badgeColor },
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
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.lg,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: spacing.xxl,
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
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
