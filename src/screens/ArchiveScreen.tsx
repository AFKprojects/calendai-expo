import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

import { NamedayHeader } from '../components/NamedayHeader';
import { NewsWidget, TriviaWidget, ProverbWidget, WordWidget } from '../components/Widgets';
import { CalendarDay, getArchive } from '../services/calendarRepository';

export const ArchiveScreen: React.FC = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [isLoading, setIsLoading] = useState(true);
  const [archiveList, setArchiveList] = useState<CalendarDay[]>([]);

  useEffect(() => {
    if (!isFocused) return;

    const loadArchive = async () => {
      try {
        const list = await getArchive();
        setArchiveList(list);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading archive:', err);
        setIsLoading(false);
      }
    };

    loadArchive();
  }, [isFocused]);

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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#444444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zerwane Kartki</Text>
        <View style={{ width: 40 }} />
      </View>

      {archiveList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Archiwum jest puste.{"\n"}Zerwij swoją pierwszą kartkę rano!
          </Text>
        </View>
      ) : (
        <FlatList
          data={archiveList}
          keyExtractor={(item) => item.dateString}
          renderItem={({ item }) => <ArchiveItemCard day={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const ArchiveItemCard: React.FC<{ day: CalendarDay }> = ({ day }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract all widgets sorted by hour
  const widgetsList = Object.values(day.hourlyWidgets).sort((a, b) => a.hour - b.hour);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        {/* Red block calendar day */}
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{day.dayOfMonth}</Text>
        </View>

        <View style={styles.dateMeta}>
          <Text style={styles.dateText}>
            {day.dayOfWeek}, {day.dayOfMonth} {day.monthName} {day.yearString}
          </Text>
          {day.namedays && day.namedays.length > 0 && (
            <Text style={styles.namedaysText} numberOfLines={1}>
              Imieniny: {day.namedays.slice(0, 3).join(', ')}
              {day.namedays.length > 3 ? '...' : ''}
            </Text>
          )}
        </View>

        {isExpanded ? (
          <ChevronUp size={20} color="#777777" />
        ) : (
          <ChevronDown size={20} color="#777777" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.cardExpansion}>
          {/* Nameday card header */}
          <NamedayHeader day={day} />

          <View style={styles.widgetsScrollContainer}>
            {widgetsList.map((widget) => {
              const hasContent = 
                widget.news.length > 0 || 
                widget.trivia || 
                widget.proverb || 
                widget.word;

              if (!hasContent) return null;

              return (
                <View key={widget.hour} style={styles.hourGroup}>
                  <View style={styles.hourLabelRow}>
                    <View style={styles.hourDot} />
                    <Text style={styles.hourLabelText}>
                      Aktualizacja z godziny {String(widget.hour).padStart(2, '0')}:00
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
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FAF9F6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#777777',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8B0000',
  },
  dateMeta: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  namedaysText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  cardExpansion: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    paddingBottom: 16,
  },
  widgetsScrollContainer: {
    marginTop: 8,
  },
  hourGroup: {
    width: '100%',
    marginVertical: 4,
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
});
