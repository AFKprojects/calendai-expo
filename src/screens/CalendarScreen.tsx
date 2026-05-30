import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Settings, ListCollapse, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { PageTearBox } from '../components/PageTearBox';
import { NamedayHeader } from '../components/NamedayHeader';
import { NewsWidget, TriviaWidget, ProverbWidget, WordWidget } from '../components/Widgets';
import { ChatWidget } from '../components/ChatWidget';
import {
  CalendarDay,
  ChatMessage,
  getCalendarDay,
  isTornOff,
  markAsTornOff,
  subscribeToChatMessages,
  sendChatMessage,
  syncUserProfile,
} from '../services/calendarRepository';

type RootStackParamList = {
  Calendar: undefined;
  Settings: undefined;
  Archive: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Calendar'>;

const formatDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(true);
  const [isTorn, setIsTorn] = useState(false);
  const [todayDay, setTodayDay] = useState<CalendarDay | null>(null);
  const [yesterdayDay, setYesterdayDay] = useState<CalendarDay | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasSentChatToday, setHasSentChatToday] = useState(false);
  const [todayDateStr, setTodayDateStr] = useState('');
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Onboarding states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingNickname, setOnboardingNickname] = useState('');
  const [isOnboardingSubmitting, setIsOnboardingSubmitting] = useState(false);

  // Load screen data
  useEffect(() => {
    if (!isFocused) return;

    const loadData = async () => {
      try {
        const today = new Date();
        const todayStr = formatDateString(today);
        setTodayDateStr(todayStr);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateString(yesterday);

        // Check if torn off
        const torn = await isTornOff(todayStr);
        setIsTorn(torn);

        // Load chat status
        const sent = await AsyncStorage.getItem(`has_sent_chat_${todayStr}`);
        setHasSentChatToday(sent === 'true');

        // Check nickname for onboarding
        const savedNickname = await AsyncStorage.getItem('chat_nickname');
        if (!savedNickname || savedNickname === 'Anonim' || savedNickname.trim() === '') {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }

        // Load calendar days
        const todayData = await getCalendarDay(todayStr);
        const yesterdayData = await getCalendarDay(yesterdayStr);

        setTodayDay(todayData);
        setYesterdayDay(yesterdayData);

        // Dynamic testing/debug hour override support
        const debugHourStr = await AsyncStorage.getItem('debug_simulated_hour');
        if (debugHourStr) {
          setCurrentHour(parseInt(debugHourStr, 10));
        } else {
          setCurrentHour(new Date().getHours());
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setIsLoading(false);
      }
    };

    loadData();
  }, [isFocused]);

  // Subscribe to chat stream
  useEffect(() => {
    if (!todayDateStr || !isFocused) return;

    const unsubscribe = subscribeToChatMessages(todayDateStr, (messages) => {
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [todayDateStr, isFocused]);

  const handleTearOff = async () => {
    if (!todayDay || !todayDateStr) return;
    setIsTorn(true);
    await markAsTornOff(todayDateStr, todayDay);
  };

  const handleSendMessage = async (nickname: string, text: string) => {
    if (!todayDateStr) return;
    const success = await sendChatMessage(todayDateStr, nickname, text);
    if (success) {
      await AsyncStorage.setItem(`has_sent_chat_${todayDateStr}`, 'true');
      setHasSentChatToday(true);
    }
  };

  const handleOnboardingSubmit = async () => {
    const trimmed = onboardingNickname.trim();
    if (!trimmed || trimmed.length > 15) {
      return;
    }

    setIsOnboardingSubmitting(true);
    try {
      // Trigger haptic feedback
      const hapticsEnabled = await AsyncStorage.getItem('haptics_enabled');
      if (hapticsEnabled !== 'false') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Save nickname to AsyncStorage
      await AsyncStorage.setItem('chat_nickname', trimmed);

      // Fetch user profile and interests to sync with Supabase
      const savedTopicsStr = await AsyncStorage.getItem('selected_topics');
      const defaultTopics = ["Nowe Technologie", "Historia Świata", "Psychologia"];
      const topics = savedTopicsStr ? JSON.parse(savedTopicsStr) : defaultTopics;

      // Sync profile to Supabase
      await syncUserProfile(trimmed, topics);

      // Hide onboarding screen
      setShowOnboarding(false);

      // Refresh/Reload calendar data just to make sure we're fully synced
      setIsLoading(true);
      const today = new Date();
      const todayStr = formatDateString(today);
      setTodayDateStr(todayStr);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateString(yesterday);

      const torn = await isTornOff(todayStr);
      setIsTorn(torn);

      const sent = await AsyncStorage.getItem(`has_sent_chat_${todayStr}`);
      setHasSentChatToday(sent === 'true');

      const todayData = await getCalendarDay(todayStr);
      const yesterdayData = await getCalendarDay(yesterdayStr);

      setTodayDay(todayData);
      setYesterdayDay(yesterdayData);

      const debugHourStr = await AsyncStorage.getItem('debug_simulated_hour');
      if (debugHourStr) {
        setCurrentHour(parseInt(debugHourStr, 10));
      } else {
        setCurrentHour(new Date().getHours());
      }
    } catch (err) {
      console.error('Failed to save onboarding nickname:', err);
    } finally {
      setIsOnboardingSubmitting(false);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaView style={styles.onboardingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.onboardingKeyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.onboardingScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.onboardingCard}>
              <Text style={styles.onboardingLogo}>CALENDAI</Text>
              <Text style={styles.onboardingSubtitle}>Twój codzienny kalendarz zrywany</Text>
              
              <View style={styles.onboardingDivider} />
              
              <Text style={styles.onboardingLabel}>Witaj w społeczności!</Text>
              <Text style={styles.onboardingDescription}>
                Zanim przejdziesz do kalendarza, wybierz swój podpis. Będzie on na stałe przypisany do Twoich dzisiejszych i przyszłych wpisów na kartach kalendarza.
              </Text>
              <Text style={styles.onboardingWarning}>
                Uwaga: Wybranego podpisu nie będzie można później zmienić!
              </Text>
              
              <TextInput
                style={[
                  styles.onboardingInput,
                  onboardingNickname.trim().length > 0 && styles.onboardingInputActive
                ]}
                value={onboardingNickname}
                onChangeText={(text) => {
                  if (text.length <= 15) {
                    setOnboardingNickname(text);
                  }
                }}
                placeholder="Wpisz swój podpis (np. Janek)..."
                placeholderTextColor="#999"
                maxLength={15}
                autoFocus
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[
                  styles.onboardingButton,
                  (!onboardingNickname.trim() || isOnboardingSubmitting) && styles.onboardingButtonDisabled
                ]}
                onPress={handleOnboardingSubmit}
                disabled={!onboardingNickname.trim() || isOnboardingSubmitting}
              >
                {isOnboardingSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.onboardingButtonText}>Rozpocznij przygodę</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={22} color="#444444" />
        </TouchableOpacity>
        
        <Text style={styles.logoText}>CALENDAI</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Archive')}
        >
          <ListCollapse size={22} color="#444444" />
        </TouchableOpacity>
      </View>

      {/* Keyboard Avoiding Container for regular view */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {todayDay && yesterdayDay ? (
            <PageTearBox
              isTorn={isTorn}
              onTearOff={handleTearOff}
              bottomPage={
                <TodayCalendarPage
                  day={todayDay}
                  chatMessages={chatMessages}
                  hasSentToday={hasSentChatToday}
                  onSendMessage={handleSendMessage}
                  currentHour={currentHour}
                />
              }
              topPage={<YesterdayCalendarPage day={yesterdayDay} />}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Błąd ładowania danych kalendarza.</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Today Revealed Page
interface TodayCalendarPageProps {
  day: CalendarDay;
  chatMessages: ChatMessage[];
  hasSentToday: boolean;
  onSendMessage: (nickname: string, message: string) => Promise<void>;
  currentHour: number;
}

const TodayCalendarPage: React.FC<TodayCalendarPageProps> = ({
  day,
  chatMessages,
  hasSentToday,
  onSendMessage,
  currentHour,
}) => {
  const unlockedHours = Array.from({ length: currentHour + 1 }, (_, i) => i);

  return (
    <ScrollView 
      style={styles.pageScroll} 
      contentContainerStyle={styles.pageScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <NamedayHeader day={day} />

      <View style={styles.widgetHeaderRow}>
        <Text style={styles.widgetHeaderText}>DZIŚ ODBLOKOWANE WIDŻETY</Text>
      </View>

      {/* Render Hourly Widgets */}
      {unlockedHours.map((hour) => {
        const widget = day.hourlyWidgets[hour];
        if (!widget) return null;

        const hasContent = 
          widget.news.length > 0 || 
          widget.trivia || 
          widget.proverb || 
          widget.word;

        if (!hasContent) return null;

        return (
          <View key={hour} style={styles.hourGroup}>
            <View style={styles.hourLabelRow}>
              <View style={styles.hourDot} />
              <Text style={styles.hourLabelText}>
                Aktualizacja z godziny {String(hour).padStart(2, '0')}:00
              </Text>
            </View>

            {widget.news && widget.news.length > 0 && <NewsWidget news={widget.news} />}
            {widget.trivia && <TriviaWidget trivia={widget.trivia} />}
            {widget.proverb && (
              <ProverbWidget proverb={widget.proverb} comment={widget.proverbComment} />
            )}
            {widget.word && widget.wordDefinition && (
              <WordWidget
                word={widget.word}
                definition={widget.wordDefinition}
                example={widget.wordExample}
              />
            )}
          </View>
        );
      })}

      {/* Chat Widget */}
      <ChatWidget
        messages={chatMessages}
        hasSentToday={hasSentToday}
        onSendMessage={onSendMessage}
      />
    </ScrollView>
  );
};

// Yesterday Cover Page (Tear-off prompt)
const YesterdayCalendarPage: React.FC<{ day: CalendarDay }> = ({ day }) => {
  return (
    <View style={styles.yesterdayPage}>
      <NamedayHeader day={day} />

      {/* Tear Prompt Card */}
      <View style={styles.tearCard}>
        <RefreshCw size={28} color="#8B0000" style={styles.tearCardIcon} />
        <Text style={styles.tearCardTitle}>NOWY DZIEŃ!</Text>
        <Text style={styles.tearCardBody}>
          Chwyć kartkę i przeciągnij ją w górę lub w dół, aby zerwać wczorajszy dzień i rozpocząć dzisiejszy.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#8B0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FAF9F6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#8B0000',
  },
  iconButton: {
    padding: 8,
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  pageScroll: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FCF9F2',
  },
  pageScrollContent: {
    paddingBottom: 32,
  },
  widgetHeaderRow: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  widgetHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.4)',
    letterSpacing: 1.2,
  },
  hourGroup: {
    width: '100%',
    marginBottom: 8,
  },
  hourLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  hourDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B0000',
    marginRight: 8,
  },
  hourLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B0000',
    opacity: 0.8,
  },
  yesterdayPage: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#FCF9F2',
  },
  tearCard: {
    margin: 24,
    padding: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.1)',
    alignItems: 'center',
  },
  tearCardIcon: {
    marginBottom: 8,
  },
  tearCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B0000',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tearCardBody: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  onboardingKeyboardAvoid: {
    flex: 1,
  },
  onboardingScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  onboardingCard: {
    backgroundColor: '#FCF9F2',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.15)',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  onboardingLogo: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#8B0000',
    marginBottom: 4,
  },
  onboardingSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  onboardingDivider: {
    width: '40%',
    height: 2,
    backgroundColor: '#8B0000',
    marginVertical: 20,
    opacity: 0.3,
  },
  onboardingLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  onboardingDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  onboardingWarning: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  onboardingInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333333',
    backgroundColor: '#FAF9F6',
    marginBottom: 16,
    textAlign: 'center',
  },
  onboardingInputActive: {
    borderColor: '#8B0000',
    borderWidth: 1.5,
  },
  onboardingButton: {
    width: '100%',
    backgroundColor: '#8B0000',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  onboardingButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  onboardingButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
