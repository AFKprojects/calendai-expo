import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Settings, ListCollapse, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
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
});
