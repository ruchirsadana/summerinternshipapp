import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, shadow } from './theme';
import { answer, STARTERS } from './concierge';

interface Turn { role: 'user' | 'assistant'; text: string; followups?: string[] }

const STORAGE_KEY = 'th.chatHistory';

const INITIAL_GREETING: Turn = {
  role: 'assistant',
  text: "Hey! 👋 I'm TH Concierge — your offline pocket-coach on Tommy Hilfiger styling, retail KPIs, VM standards, and customer scripts. No internet needed. Ask me anything!",
  followups: STARTERS.slice(0, 4),
};

/** Simulated "typing" delay so the bot feels less robotic. */
const TYPE_DELAY = 550;

/** Returns browser SpeechRecognition class (web only). */
function getSpeechRecognition(): any | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function ChatFab() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Turn[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const recogRef = useRef<any>(null);

  const voiceAvailable = !!getSpeechRecognition();

  // Hydrate persisted chat on first mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Turn[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) setHistory(parsed);
        }
      } catch {}
    })();
  }, []);

  // Persist last 30 turns
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30))).catch(() => {});
  }, [history]);

  // Auto-scroll
  useEffect(() => {
    if (open) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [history, busy, open]);

  const send = (textOverride?: string) => {
    const message = (textOverride ?? input).trim();
    if (!message || busy) return;
    setInput('');
    setHistory(h => [...h, { role: 'user', text: message }]);
    setBusy(true);
    setTimeout(() => {
      const reply = answer(message);
      setHistory(h => [...h, { role: 'assistant', text: reply.text, followups: reply.followups }]);
      setBusy(false);
    }, TYPE_DELAY);
  };

  const reset = () => {
    setHistory([INITIAL_GREETING]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  /** Toggle voice dictation via the browser SpeechRecognition API (free, no credits). */
  const toggleVoice = () => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    // Stop if already running
    if (listening) {
      try { recogRef.current?.stop(); } catch {}
      setListening(false);
      return;
    }
    try {
      const recog = new SR();
      recog.lang = 'en-IN';
      recog.continuous = false;
      recog.interimResults = true;
      recog.maxAlternatives = 1;

      let finalText = '';
      recog.onresult = (evt: any) => {
        let interim = '';
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          const r = evt.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        setInput((finalText + interim).trim());
      };
      recog.onerror = (e: any) => {
        setListening(false);
        if (e?.error && e.error !== 'aborted' && e.error !== 'no-speech') {
          // Surface mic-permission style errors gently
          setHistory(h => [
            ...h,
            { role: 'assistant', text: `Voice input failed (${e.error}). Make sure mic permission is granted.` },
          ]);
        }
      };
      recog.onend = () => {
        setListening(false);
        const text = finalText.trim();
        if (text) {
          // Auto-send the final transcript
          setTimeout(() => send(text), 200);
        }
      };
      recogRef.current = recog;
      setInput('');
      setListening(true);
      recog.start();
    } catch (err) {
      setListening(false);
    }
  };

  // Stop the recogniser if the panel is closed while it's listening
  useEffect(() => {
    if (!open && listening) {
      try { recogRef.current?.stop(); } catch {}
      setListening(false);
    }
  }, [open, listening]);

  const lastBotFollowups = (() => {
    for (let i = history.length - 1; i >= 0; i--) {
      const t = history[i];
      if (t.role === 'assistant' && t.followups?.length) return t.followups;
      if (t.role === 'user') return null;
    }
    return null;
  })();

  return (
    <>
      {/* Floating button — fixed bottom-right, above tab bar */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        <TouchableOpacity
          accessibilityLabel="Open TH Concierge"
          testID="chat-fab"
          activeOpacity={0.85}
          onPress={() => setOpen(true)}
          style={styles.fab}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color={colors.white} />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Chat panel */}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} transparent>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerAvatar}>
                <Ionicons name="sparkles" size={18} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>TH Concierge</Text>
                <Text style={styles.headerSub}>Styling · KPIs · VM · Scripts</Text>
              </View>
              <TouchableOpacity onPress={reset} style={styles.headerBtn} testID="chat-reset" accessibilityLabel="Clear chat">
                <Ionicons name="refresh" size={18} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.headerBtn} testID="chat-close">
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={20}
            >
              <ScrollView
                ref={scrollRef}
                style={styles.body}
                contentContainerStyle={{ padding: 14, gap: 10 }}
                keyboardShouldPersistTaps="handled"
              >
                {history.map((t, i) => (
                  <View
                    key={i}
                    style={[styles.bubble, t.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}
                  >
                    <Text style={[styles.bubbleText, t.role === 'user' && { color: colors.white }]}>
                      {t.text}
                    </Text>
                  </View>
                ))}
                {busy && (
                  <View style={[styles.bubble, styles.bubbleBot, styles.typing]}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, { opacity: 0.6 }]} />
                    <View style={[styles.dot, { opacity: 0.35 }]} />
                  </View>
                )}

                {/* Follow-up chips, ONLY when last message is from the bot and not busy */}
                {!busy && lastBotFollowups && (
                  <View style={{ marginTop: 6, gap: 6 }}>
                    {history.length <= 1 && (
                      <Text style={styles.suggestionsLabel}>TRY ASKING</Text>
                    )}
                    {lastBotFollowups.map(s => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => send(s)}
                        style={styles.suggestion}
                        testID={`chat-suggest-${s.slice(0, 10)}`}
                      >
                        <Ionicons name="arrow-forward-circle" size={14} color={colors.navy} />
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputRow}>
                {voiceAvailable && (
                  <TouchableOpacity
                    testID="chat-mic"
                    onPress={toggleVoice}
                    style={[styles.micBtn, listening && styles.micBtnActive]}
                    accessibilityLabel={listening ? 'Stop voice input' : 'Start voice input'}
                  >
                    <Ionicons
                      name={listening ? 'mic' : 'mic-outline'}
                      size={20}
                      color={listening ? colors.white : colors.navy}
                    />
                  </TouchableOpacity>
                )}
                <TextInput
                  testID="chat-input"
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder={listening ? '🎙️  Listening…' : 'Ask about TH styling, VM, KPIs…'}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={() => send()}
                  multiline
                  maxLength={500}
                  editable={!busy}
                  blurOnSubmit={true}
                />
                <TouchableOpacity
                  testID="chat-send"
                  onPress={() => send()}
                  disabled={busy || !input.trim()}
                  style={[styles.sendBtn, (busy || !input.trim()) && { opacity: 0.5 }]}
                  accessibilityLabel="Send message"
                >
                  <Ionicons name="send" size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
              {listening && (
                <View style={styles.listeningBar}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.listeningText}>Listening — speak your question, I'll send it when you pause</Text>
                </View>
              )}
              <View style={styles.footer}>
                <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
                <Text style={styles.footerText}>
                  Runs 100% offline · no data leaves your device{voiceAvailable ? ' · 🎤 voice supported' : ''}
                </Text>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 16,
    bottom: 78,
    zIndex: 9999,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as any) : {}),
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center',
    ...shadow.elevated,
    shadowColor: colors.red, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: colors.gold, paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1.5, borderColor: colors.white,
  },
  fabBadgeText: { color: colors.navy, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,26,48,0.55)', justifyContent: 'flex-end' },
  panel: {
    height: '85%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.navy, paddingHorizontal: 14, paddingVertical: 12, paddingTop: 14,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  headerSub: { color: '#AAB5CE', fontSize: 11, fontWeight: '600', marginTop: 2 },
  headerBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)',
  },
  body: { flex: 1, backgroundColor: colors.bg },
  bubble: {
    maxWidth: '88%' as any, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: colors.red, borderBottomRightRadius: 4,
  },
  bubbleBot: {
    alignSelf: 'flex-start', backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.borderLight, borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  typing: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 14 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.navy },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6,
    backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: colors.bg, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: colors.navy, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.red, borderColor: colors.red,
  },
  listeningBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1, borderTopColor: '#FECACA',
  },
  pulseDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red,
  },
  listeningText: {
    flex: 1, fontSize: 11, color: colors.red, fontWeight: '700',
  },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: colors.white,
  },
  footerText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  suggestionsLabel: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 0.8, marginBottom: 2,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, padding: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  suggestionText: { flex: 1, color: colors.navy, fontSize: 13, fontWeight: '600' },
});
