import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpatialContainer } from '../../components/SpatialContainer';
import { ChatBubble } from '../../components/ChatBubble';
import { TypingIndicator } from '../../components/TypingIndicator';
import { HologramAvatar } from '../../components/HologramAvatar';
import { CrisisAlert } from '../../components/CrisisAlert';
import { LocationPermissionModal } from '../../components/LocationPermissionModal';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useChat } from '../../hooks/useChat';
import { locationService } from '../../services/location';
import { MentalHealthCenter } from '../../types/chat';

export const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    messages,
    loading,
    currentEmotion,
    protocoloCrisisActivo,
    testCompleto,
    resultado,
    sendMessage,
    closeCrisisModal,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState<MentalHealthCenter[]>([]);
  const [showCentersModal, setShowCentersModal] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const flatListRef = useRef<FlatList>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // Navigate to ResultScreen when test finishes
  useEffect(() => {
    if (testCompleto && resultado) {
      navigation.navigate('Result', { resultado });
    }
  }, [testCompleto, resultado, navigation]);

  const handleSend = () => {
    if (!inputMessage.trim() || loading) return;
    const text = inputMessage;
    setInputMessage('');
    sendMessage(text);
  };

  const handleGrantLocation = async () => {
    setShowLocationModal(false);
    const loc = await locationService.getCurrentLocation();
    const centers = locationService.getNearbyCenters();
    setNearbyCenters(centers);
    setShowCentersModal(true);

    if (loc) {
      sendMessage('He compartido mi ubicación para buscar centros cercanos.', loc.lat, loc.lon);
    }
  };

  const handleDenyLocation = () => {
    setShowLocationModal(false);
    const centers = locationService.getNearbyCenters();
    setNearbyCenters(centers);
    setShowCentersModal(true);
  };

  return (
    <SpatialContainer variant={protocoloCrisisActivo ? 'crisis' : 'normal'}>
      <View style={styles.container}>
        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <Pressable
            style={[styles.modeTab, mode === 'chat' && styles.modeTabActive]}
            onPress={() => setMode('chat')}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={mode === 'chat' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeTabText, mode === 'chat' && styles.modeTabTextActive]}>
              {' '}
              Chat
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}
            onPress={() => setMode('voice')}>
            <Ionicons
              name="mic-outline"
              size={16}
              color={mode === 'voice' ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.modeTabText, mode === 'voice' && styles.modeTabTextActive]}>
              {' '}
              Voz
            </Text>
          </Pressable>
        </View>

        {mode === 'chat' ? (
          <>
            <View style={styles.hero}>
              <HologramAvatar emotion={currentEmotion} typing={loading} voiceMode={false} />
              <Text style={styles.heroName}>Amiga Hamilton</Text>
              <Text style={styles.heroSub}>Aquí para escucharte siempre</Text>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ChatBubble message={item} />}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={loading ? <TypingIndicator /> : null}
            />

            {protocoloCrisisActivo && (
              <View style={styles.crisisOverlayContainer}>
                <CrisisAlert
                  onClose={closeCrisisModal}
                  onRequestLocation={() => setShowLocationModal(true)}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Cuéntame cómo te sientes..."
                placeholderTextColor={colors.textMuted}
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
                maxLength={1000}
                editable={!loading}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  (!inputMessage.trim() || loading) && styles.sendButtonDisabled,
                  pressed && !loading && { opacity: 0.85 },
                ]}
                onPress={handleSend}
                disabled={!inputMessage.trim() || loading}>
                <Ionicons name="arrow-forward" size={22} color={colors.onPrimary} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.voiceContainer}>
            <HologramAvatar
              emotion={currentEmotion}
              typing={loading}
              voiceMode
              onPress={() => setVoiceMode((prev) => !prev)}
            />
            <Text style={styles.voiceHint}>
              {voiceMode ? 'Escuchando...' : 'Toca el holograma para activar voz'}
            </Text>
          </View>
        )}
      </View>

      {/* Location Permission Request Modal */}
      <LocationPermissionModal
        visible={showLocationModal}
        onGrant={handleGrantLocation}
        onDeny={handleDenyLocation}
      />

      {/* Nearby Centers Modal */}
      <Modal visible={showCentersModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Centros de Salud Mental en Cusco</Text>
              <Pressable
                onPress={() => setShowCentersModal(false)}
                style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.centersList}>
              {nearbyCenters.map((center) => (
                <View key={center.id} style={styles.centerItem}>
                  <Text style={styles.centerName}>{center.nombre}</Text>
                  <View style={styles.centerRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.centerAddress}> {center.direccion}</Text>
                  </View>
                  <View style={styles.centerRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.centerHours}> {center.horario}</Text>
                  </View>
                  <View style={styles.centerRow}>
                    <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.centerPhone}> {center.telefono}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  heroName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  crisisOverlayContainer: {
    paddingHorizontal: spacing.screenPadding,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceHighest,
    opacity: 0.4,
  },
  modeSwitcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceLow,
    borderRadius: spacing.borderRadiusDefault,
    padding: 2,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusSm,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.primary,
  },
  voiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  voiceHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.borderRadiusLg,
    borderTopRightRadius: spacing.borderRadiusLg,
    padding: spacing.screenPadding,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.glassBorderActive,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  centersList: {
    marginBottom: spacing.md,
  },
  centerItem: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    padding: spacing.md,
    borderRadius: spacing.borderRadiusSm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  centerName: {
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
    marginBottom: 2,
  },
  centerPhone: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
