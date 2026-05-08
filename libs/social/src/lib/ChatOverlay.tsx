// ---------------------------------------------------------------------------
// ChatOverlay – floating in-game chat UI with quick replies & message bubbles
// ---------------------------------------------------------------------------

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatMessage, ChatService, QUICK_REPLIES } from './chat.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatOverlayProps {
  /** Current room / game identifier. */
  roomId: string;
  /** Current user info. */
  user: { userId: string; username: string };
  /** Locale key for quick replies (en, fr, ar, darija, es). */
  locale: string;
  /** Called when the user sends a message (parent persists / broadcasts). */
  onSend: (message: ChatMessage) => void;
  /** External message feed (parent keeps the source of truth). */
  messages: ChatMessage[];
  /** Optional max height of the expanded panel (default 320). */
  maxHeight?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PANEL_MAX = 320;

const chatService = new ChatService();

export function ChatOverlay({
  roomId,
  user,
  locale,
  onSend,
  messages,
  maxHeight = PANEL_MAX,
}: ChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Track unread while panel is closed
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (!isOpen && messages.length > prevCountRef.current) {
      setUnread((u) => u + (messages.length - prevCountRef.current));
    }
    prevCountRef.current = messages.length;
  }, [messages.length, isOpen]);

  // Animate open/close
  const toggle = useCallback(() => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) setUnread(0);
    Animated.spring(slideAnim, {
      toValue: opening ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isOpen, slideAnim]);

  // Send text message
  const sendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg = chatService.sendMessage(roomId, {
      roomId,
      senderId: user.userId,
      senderName: user.username,
      content: trimmed,
      type: 'text',
    });
    onSend(msg);
    setText('');
  }, [text, roomId, user, onSend]);

  // Send quick reply
  const sendQuickReply = useCallback(
    (key: string) => {
      const content = chatService.getQuickReply(key, locale);
      const msg = chatService.sendMessage(roomId, {
        roomId,
        senderId: user.userId,
        senderName: user.username,
        content,
        type: 'quick_reply',
      });
      onSend(msg);
    },
    [roomId, user, locale, onSend],
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isOpen]);

  const panelHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  // -- Render helpers --------------------------------------------------------

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user.userId;
    const isSystem = item.type === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleRow, isMe ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const quickReplyKeys = Object.keys(QUICK_REPLIES).slice(0, 10);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Expandable panel */}
      <Animated.View style={[styles.panel, { height: panelHeight }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.panelInner}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
          />

          {/* Quick replies */}
          <FlatList
            data={quickReplyKeys}
            keyExtractor={(k) => k}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickReplyBar}
            renderItem={({ item: key }) => (
              <TouchableOpacity
                style={styles.quickReplyChip}
                onPress={() => sendQuickReply(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReplyText}>
                  {chatService.getQuickReply(key, locale)}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Text input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              maxLength={200}
              onSubmitEditing={sendText}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendText} activeOpacity={0.7}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Floating toggle button */}
      <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>{isOpen ? '\u2715' : '\uD83D\uDCAC'}</Text>
        {!isOpen && unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_W } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: { fontSize: 22, color: '#FFF' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#C62828',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  panel: {
    width: Math.min(SCREEN_W - 32, 360),
    backgroundColor: '#142638',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  panelInner: { flex: 1 },

  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 8, paddingTop: 8 },

  // Bubbles
  bubbleRow: { marginBottom: 6 },
  bubbleRowLeft: { alignItems: 'flex-start' },
  bubbleRowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bubbleMe: { backgroundColor: '#1E3A5F' },
  bubbleOther: { backgroundColor: '#263B50' },
  senderName: { fontSize: 11, color: '#C9A84C', marginBottom: 2, fontWeight: '600' },
  bubbleText: { fontSize: 14, color: '#E0E0E0' },
  bubbleTextMe: { color: '#FFFFFF' },
  timestamp: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'right' },

  // System
  systemRow: { alignItems: 'center', marginVertical: 4 },
  systemText: { fontSize: 12, color: '#888', fontStyle: 'italic' },

  // Quick replies
  quickReplyBar: { maxHeight: 36, paddingHorizontal: 4, flexGrow: 0 },
  quickReplyChip: {
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 3,
  },
  quickReplyText: { fontSize: 12, color: '#C9A84C' },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0A1929',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#FFF',
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 6,
    backgroundColor: '#C9A84C',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sendBtnText: { color: '#0A1929', fontWeight: '700', fontSize: 13 },
});
