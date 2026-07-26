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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SpatialContainer } from '../../components/SpatialContainer';
import { WelcomeModal } from '../../components/WelcomeModal';
import { ChatBubble } from '../../components/ChatBubble';
import { TypingIndicator } from '../../components/TypingIndicator';
import { HologramAvatar } from '../../components/HologramAvatar';
import { VoiceWave } from '../../components/VoiceWave';
import { CrisisAlert } from '../../components/CrisisAlert';
import { LocationPermissionModal } from '../../components/LocationPermissionModal';
import { Glass, GlassScrim } from '../../components/Glass';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { glassGlow } from '../../constants/glass';
import { useChat } from '../../hooks/useChat';
import { useDictado } from '../../hooks/useDictado';
import { storage } from '../../utils/storage';
import { locationService } from '../../services/location';
import { voz } from '../../services/voz';
import { MentalHealthCenter } from '../../types/chat';

export const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    messages,
    loading,
    currentEmotion,
    protocoloCrisisActivo,
    testCompleto,
    resultado,
    ubicacionSolicitada,
    sendMessage,
    closeCrisisModal,
    clearUbicacionSolicitada,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState<MentalHealthCenter[]>([]);
  const [showCentersModal, setShowCentersModal] = useState(false);
  const [voiceCall, setVoiceCall] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const voiceLoopRef = useRef(false);
  const dictado = useDictado();

  useEffect(() => {
    storage.isOnboarded().then((done) => {
      if (!done) setShowWelcome(true);
    });
  }, []);

  // Control Keyboard state for dynamic bottom padding
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // En modo voz: cuando termina de hablar, inicia grabación automáticamente
  const iniciarGrabacionSiAplica = React.useCallback(async () => {
    if (!voiceLoopRef.current) return;
    setHablando(false);
    await dictado.cancelar();
    await dictado.iniciar();
  }, [dictado]);

  // Cuando se activa modo voz
  useEffect(() => {
    if (!voiceCall) return;
    voiceLoopRef.current = true;

    const ultimo = messages.length > 0 ? messages[messages.length - 1] : null;
    const ultimoAsistente = ultimo?.role === 'assistant' ? ultimo : null;
    if (!ultimoAsistente) {
      iniciarGrabacionSiAplica();
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHablando(true);
    voz.hablar(ultimoAsistente.content, iniciarGrabacionSiAplica);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceCall]);

  // En modo voz: cuando llega un mensaje NUEVO del asistente, lo lee en alto
  useEffect(() => {
    if (!voiceCall) return;
    if (messages.length === 0) return;

    const ultimo = messages[messages.length - 1];
    if (ultimo.role !== 'assistant') return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHablando(true);
    voz.hablar(ultimo.content, iniciarGrabacionSiAplica);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Al salir de la pantalla no debe quedar voz sonando de fondo.
  useEffect(() => {
    return () => {
      voz.callar();
    };
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim() || loading) return;
    const text = inputMessage;
    setInputMessage('');
    sendMessage(text);
  };

  const locationModalVisible = showLocationModal || ubicacionSolicitada;

  const cerrarLocationModal = () => {
    setShowLocationModal(false);
    clearUbicacionSolicitada();
  };

  const handleGrantLocation = async () => {
    cerrarLocationModal();
    const loc = await locationService.getCurrentLocation();
    const centers = locationService.getNearbyCenters();
    setNearbyCenters(centers);
    setShowCentersModal(true);

    if (loc) {
      sendMessage('He compartido mi ubicación para buscar centros cercanos.', loc.lat, loc.lon);
    }
  };

  const handleDenyLocation = () => {
    cerrarLocationModal();
    const centers = locationService.getNearbyCenters();
    setNearbyCenters(centers);
    setShowCentersModal(true);
  };

  const canSend = Boolean(inputMessage.trim()) && !loading;

  // --- Modo voz ---------------------------------------------------------
  const alternarEscucha = async () => {
    if (dictado.grabando) {
      const texto = await dictado.detenerYTranscribir();
      if (texto) sendMessage(texto);
      return;
    }
    await voz.callar();
    setHablando(false);
    await dictado.iniciar();
  };

  const cerrarModoVoz = async () => {
    voiceLoopRef.current = false;
    await dictado.cancelar();
    await voz.callar();
    setHablando(false);
    setVoiceCall(false);
  };

  const estadoVoz = dictado.grabando
    ? 'Te escucho... toca para enviar'
    : dictado.transcribiendo
      ? 'Transcribiendo...'
      : loading
        ? 'Pensando...'
        : hablando
          ? 'Hablando...'
          : 'Toca para hablar';

  return (
    <SpatialContainer variant={protocoloCrisisActivo ? 'crisis' : 'normal'}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={[styles.container, { paddingBottom: keyboardVisible ? 10 : 80 }]}>
          {/* Header */}
          <Glass
            level="low"
            radius={0}
            borderColor="transparent"
            highlight={false}
            contentStyle={styles.hero}>
            <HologramAvatar
              emotion={currentEmotion}
              typing={loading}
              voiceMode={false}
              size="sm"
              onPress={() => setShowProfileModal(true)}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>Amiga Hamilton</Text>
              <Text style={styles.heroStatus}>{loading ? 'escribiendo...' : 'en línea'}</Text>
            </View>
          </Glass>

          {/* Messages list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <>
                {loading ? <TypingIndicator /> : null}
                <View style={{ height: 20 }} />
              </>
            }
          />

          {protocoloCrisisActivo && (
            <CrisisAlert
              onClose={closeCrisisModal}
              onRequestLocation={() => setShowLocationModal(true)}
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <Pressable
              style={[
                styles.inputWrapper,
                inputFocused && styles.inputWrapperFocused,
                inputFocused && glassGlow(colors.primary, 12),
              ]}
              onPress={() => inputRef.current?.focus()}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={loading ? 'Hamilton está pensando...' : 'Cuéntame cómo te sientes...'}
                placeholderTextColor={colors.textMuted}
                value={inputMessage}
                onChangeText={setInputMessage}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                multiline
                maxLength={1000}
                editable={!loading}
                textAlignVertical="center"
              />
            </Pressable>

            {/* Action buttons row with clean separation */}
            <View style={styles.actionButtonsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hablar por voz"
                style={({ pressed }) => [styles.micBtn, pressed && styles.pressed]}
                onPress={() => setVoiceCall(true)}>
                <Ionicons name="mic-outline" size={20} color={colors.primary} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje"
                accessibilityState={{ disabled: !canSend }}
                style={({ pressed }) => [
                  styles.sendButton,
                  canSend && styles.sendButtonActive,
                  canSend && glassGlow(colors.primary, 14),
                  pressed && canSend && styles.pressed,
                ]}
                onPress={handleSend}
                disabled={!canSend}>
                <Ionicons
                  name="send"
                  size={18}
                  style={styles.sendIcon}
                  color={canSend ? colors.white : colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <WelcomeModal
        visible={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          storage.setOnboarded();
        }}
      />

      {voiceCall && (
        <View style={styles.voiceOverlay}>
          <LinearGradient
            colors={colors.spaceGradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar modo voz"
            style={({ pressed }) => [styles.closeVoiceBtn, pressed && styles.pressed]}
            onPress={cerrarModoVoz}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dictado.grabando ? 'Enviar lo que dijiste' : 'Empezar a hablar'}
            onPress={alternarEscucha}
            disabled={dictado.transcribiendo || loading}
            style={styles.voiceTapArea}>
            <VoiceWave speaking={dictado.grabando || hablando} />
            <Text style={styles.voiceTitle}>Amiga Hamilton</Text>
            <Text style={styles.voiceStatus}>{estadoVoz}</Text>
          </Pressable>
          {dictado.error ? <Text style={styles.voiceError}>{dictado.error}</Text> : null}
        </View>
      )}

      {/* Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.profileOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowProfileModal(false)} />
          <View style={styles.profileCard}>
            <Pressable
              style={styles.profileClose}
              onPress={() => setShowProfileModal(false)}
              hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.profileAvatarWrap}>
              <HologramAvatar emotion={currentEmotion} size="lg" />
            </View>
            <Text style={styles.profileName}>Amiga Hamilton</Text>
            <Text style={styles.profileStatus}>en línea</Text>
            <Text style={styles.profileDesc}>
              Tu acompañante personal para el bienestar emocional. Estoy aquí para escucharte,
              apoyarte y guiarte en tu proceso, sin prisas ni juicios.
            </Text>
            <View style={styles.profileDivider} />
            <View style={styles.profileInfoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.secondary} />
              <Text style={styles.profileInfoText}>Conversaciones 100% confidenciales</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.tertiary} />
              <Text style={styles.profileInfoText}>Evaluación personalizada Hamilton</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Permission Request Modal */}
      <LocationPermissionModal
        visible={locationModalVisible}
        onGrant={handleGrantLocation}
        onDeny={handleDenyLocation}
      />

      {/* Nearby Centers Modal */}
      <Modal visible={showCentersModal} transparent animationType="slide" statusBarTranslucent>
        <GlassScrim style={styles.sheetScrim}>
          <Glass
            level="high"
            style={styles.sheet}
            radiusStyle={styles.sheetRadius}
            contentStyle={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Centros de Salud Mental en Cusco</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={8}
                onPress={() => setShowCentersModal(false)}
                style={({ pressed }) => pressed && styles.pressed}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.centersList}>
              {nearbyCenters.map((center) => (
                <View key={center.id} style={styles.centerItem}>
                  <Text style={styles.centerName}>{center.nombre}</Text>
                  <View style={styles.centerRow}>
                    <Ionicons name="navigate-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.centerAddress}> {center.direccion}</Text>
                  </View>
                  <View style={styles.centerRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.centerHours}> {center.horario}</Text>
                  </View>
                  <View style={styles.centerRow}>
                    <Ionicons name="call-outline" size={14} color={colors.accent} />
                    <Text style={styles.centerPhone}> {center.telefono}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Glass>
        </GlassScrim>
      </Modal>
    </SpatialContainer>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  heroInfo: {
    marginLeft: spacing.sm + 2,
  },
  heroName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  heroStatus: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 1,
  },
  messageList: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    backgroundColor: colors.surfaceLow,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.borderDark,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusXl,
    minHeight: 46,
    justifyContent: 'center',
  },
  inputWrapperFocused: {
    borderColor: colors.glassBorderActive,
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: 8,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sendIcon: {
    marginLeft: 2,
  },
  voiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeVoiceBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  voiceTapArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 40,
  },
  voiceStatus: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  voiceError: {
    position: 'absolute',
    bottom: 60,
    left: spacing.xl,
    right: spacing.xl,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },

  sheetScrim: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  sheet: {
    width: '100%',
    maxHeight: '80%',
  },
  sheetRadius: {
    borderTopLeftRadius: spacing.borderRadiusXl,
    borderTopRightRadius: spacing.borderRadiusXl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sheetContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.md,
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
    flexShrink: 1,
    marginRight: spacing.sm,
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
    backgroundColor: colors.surfaceInset,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  centerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  pressed: {
    opacity: 0.8,
  },

  // Profile Modal
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 14, 32, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#1a1a30',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.screenPadding,
  },
  profileClose: {
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  profileAvatarWrap: {
    marginBottom: spacing.md,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileStatus: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  profileDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  profileDivider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: 10,
  },
  profileInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
