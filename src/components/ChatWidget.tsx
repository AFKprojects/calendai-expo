import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send, Share2 } from 'lucide-react-native';
import { ChatMessage } from '../services/calendarRepository';

interface ChatWidgetProps {
  messages: ChatMessage[];
  hasSentToday: boolean;
  onSendMessage: (nickname: string, message: string) => Promise<boolean>;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  hasSentToday,
  onSendMessage,
}) => {
  const [nicknameText, setNicknameText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load saved nickname on mount
  useEffect(() => {
    const loadNickname = async () => {
      try {
        const savedNickname = await AsyncStorage.getItem('chat_nickname');
        if (savedNickname) {
          setNicknameText(savedNickname);
        }
      } catch (err) {
        console.error('Failed to load nickname:', err);
      }
    };
    loadNickname();
  }, []);

  const handleSend = async () => {
    if (!nicknameText.trim() || !messageText.trim()) {
      setIsError(true);
      return;
    }

    setIsError(false);
    setIsSending(true);
    try {
      const success = await onSendMessage(nicknameText.trim(), messageText.trim());
      if (success) {
        setMessageText('');
      } else {
        Alert.alert('Błąd', 'Nie udało się opublikować wpisu. Spróbuj ponownie później.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Błąd', 'Wystąpił nieoczekiwany problem przy wysyłaniu wpisu.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Share2 size={18} color="#8B0000" />
        <Text style={styles.title}>MYŚL DNIA SPOŁECZNOŚCI</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>
          Zostaw jeden ślad na dzisiejszej kartce. Maksymalnie 150 znaków.
        </Text>

        {/* Message Stream */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak dzisiejszych wpisów. Bądź pierwszy!</Text>
          </View>
        ) : (
          <View style={styles.streamContainer}>
            {[...messages]
              .reverse()
              .slice(0, 10)
              .map((msg) => (
                <View key={msg.id || msg.timestamp} style={styles.msgRow}>
                  <Text style={styles.msgUser} numberOfLines={1}>
                    {msg.userName}:
                  </Text>
                  <Text style={styles.msgText}>{msg.message}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Input form */}
        {!hasSentToday ? (
          <View style={styles.formContainer}>
            <View style={styles.inputsRow}>
              <TextInput
                style={[styles.input, styles.nicknameInput, styles.disabledInput]}
                value={nicknameText}
                editable={false}
                placeholder="Podpis"
                placeholderTextColor="#999"
                maxLength={15}
              />
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={messageText}
                onChangeText={(text) => {
                  if (text.length <= 150) {
                    setMessageText(text);
                    setIsError(false);
                  }
                }}
                placeholder="Napisz coś..."
                placeholderTextColor="#999"
                maxLength={150}
                multiline
              />
            </View>

            {isError && (
              <Text style={styles.errorText}>
                Podpis i wiadomość nie mogą być puste!
              </Text>
            )}

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Send size={16} color="#FFF" />
                  <Text style={styles.sendButtonText}>Opublikuj dzisiejszy wpis</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              ✓ Twój ślad na dzisiejszej kartce został zapisany!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#8B0000',
    marginLeft: 8,
  },
  body: {
    width: '100%',
  },
  subtitle: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  streamContainer: {
    marginBottom: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  msgUser: {
    width: 90,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  msgText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 18,
  },
  formContainer: {
    marginTop: 8,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FAF9F6',
  },
  nicknameInput: {
    flex: 0.35,
    marginRight: 8,
  },
  disabledInput: {
    backgroundColor: '#EAE9E6',
    color: '#777777',
  },
  messageInput: {
    flex: 0.65,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#8B0000',
    fontSize: 12,
    marginTop: 6,
  },
  sendButton: {
    backgroundColor: '#8B0000',
    borderRadius: 8,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  successContainer: {
    backgroundColor: 'rgba(91, 140, 90, 0.08)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  successText: {
    color: '#5B8C5A',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
