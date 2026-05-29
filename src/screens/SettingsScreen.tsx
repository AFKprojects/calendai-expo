import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Star, Bell, Info, RefreshCw, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncUserProfile } from '../services/calendarRepository';

const ALL_TOPICS = [
  "Nowe Technologie",
  "Psychologia",
  "Historia Świata",
  "Astronomia i Kosmos",
  "Przyroda i Ekologia",
  "Sztuka i Literatura",
  "Zdrowy Styl Życia",
  "Ciekawostki Kulinarne",
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [nickname, setNickname] = useState('Anonim');
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [debugSimulatedHour, setDebugSimulatedHour] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedNick = (await AsyncStorage.getItem('chat_nickname')) || 'Anonim';
        setNickname(savedNick);

        const savedHaptics = await AsyncStorage.getItem('haptics_enabled');
        setIsHapticsEnabled(savedHaptics !== 'false'); // Defaults to true

        const savedTopicsStr = await AsyncStorage.getItem('selected_topics');
        const defaultTopics = ["Nowe Technologie", "Historia Świata", "Psychologia"];
        const topics = savedTopicsStr ? JSON.parse(savedTopicsStr) : defaultTopics;
        setSelectedTopics(topics);

        const savedHour = await AsyncStorage.getItem('debug_simulated_hour');
        if (savedHour) {
          setDebugSimulatedHour(savedHour);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  const saveNickname = async (text: string) => {
    if (text.length > 15) return;
    setNickname(text);
    await AsyncStorage.setItem('chat_nickname', text);
    // Sync to Supabase in the background
    syncUserProfile(text, selectedTopics);
  };

  const toggleTopic = async (topic: string) => {
    let updated = [...selectedTopics];
    if (updated.includes(topic)) {
      updated = updated.filter((t) => t !== topic);
    } else {
      updated.push(topic);
    }
    setSelectedTopics(updated);
    await AsyncStorage.setItem('selected_topics', JSON.stringify(updated));
    // Sync to Supabase in background
    syncUserProfile(nickname, updated);
  };

  const toggleHaptics = async (value: boolean) => {
    setIsHapticsEnabled(value);
    await AsyncStorage.setItem('haptics_enabled', value ? 'true' : 'false');
  };

  const handleSetSimulatedHour = async (val: string) => {
    setDebugSimulatedHour(val);
    if (val === '') {
      await AsyncStorage.removeItem('debug_simulated_hour');
    } else {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 23) {
        Alert.alert('Błąd', 'Podaj godzinę w przedziale od 0 do 23');
        return;
      }
      await AsyncStorage.setItem('debug_simulated_hour', val);
    }
  };

  const resetTearOffState = async () => {
    try {
      await AsyncStorage.removeItem('last_torn_date');
      Alert.alert('Sukces', 'Zresetowano stan zrywania kartki. Powróć na główny ekran aby go przetestować!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#444444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ustawienia</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.sectionHeaderRow}>
          <User size={18} color="#8B0000" />
          <Text style={styles.sectionTitle}>Profil czatu</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Podpis na tablicy</Text>
          <Text style={styles.cardDescription}>
            Twoja nazwa wyświetlana na dzisiejszej kartce kalendarza przy opublikowanym wpisie.
          </Text>
          <TextInput
            style={styles.textInput}
            value={nickname}
            onChangeText={saveNickname}
            placeholder="Twój podpis..."
            maxLength={15}
          />
        </View>

        {/* AI Topics */}
        <View style={styles.sectionHeaderRow}>
          <Star size={18} color="#8B0000" />
          <Text style={styles.sectionTitle}>Twoje zainteresowania AI</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tematyka widżetów</Text>
          <Text style={styles.cardDescription}>
            Wybrane tematy będą stanowić bazę dla generowania prasówek, ciekawostek oraz mądrości dnia przez sztuczną inteligencję.
          </Text>

          <View style={styles.chipContainer}>
            {ALL_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <TouchableOpacity
                  key={topic}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleTopic(topic)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {topic}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Haptics */}
        <View style={styles.sectionHeaderRow}>
          <Bell size={18} color="#8B0000" />
          <Text style={styles.sectionTitle}>Efekty i haptyka</Text>
        </View>

        <View style={[styles.card, styles.rowCard]}>
          <View style={styles.rowCardLeft}>
            <Text style={styles.cardLabel}>Wibracje przy zrywaniu</Text>
            <Text style={styles.cardDescription}>
              Haptyczne sprzężenie zwrotne dające poczucie oporu rozrywanej kartki papieru.
            </Text>
          </View>
          <Switch
            value={isHapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: '#D1D1D1', true: 'rgba(139, 0, 0, 0.4)' }}
            thumbColor={isHapticsEnabled ? '#8B0000' : '#F4F3F0'}
          />
        </View>

        {/* Developer / Testing Override Tools */}
        <View style={styles.sectionHeaderRow}>
          <Clock size={18} color="#8B0000" />
          <Text style={styles.sectionTitle}>Opcje deweloperskie (Testowanie)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Symulowana godzina odblokowania</Text>
          <Text style={styles.cardDescription}>
            Wprowadź godzinę (0-23) aby przetestować odblokowanie widżetów na osi czasu. Pozostaw puste aby korzystać z aktualnej godziny systemowej.
          </Text>
          <TextInput
            style={styles.textInput}
            value={debugSimulatedHour}
            onChangeText={handleSetSimulatedHour}
            placeholder="Np. 15 (pozostaw puste dla czasu rzeczywistego)"
            keyboardType="number-pad"
            maxLength={2}
          />

          <View style={styles.divider} />

          <TouchableOpacity style={styles.resetButton} onPress={resetTearOffState}>
            <RefreshCw size={16} color="#8B0000" />
            <Text style={styles.resetButtonText}>Zresetuj zerwanie dzisiejszej kartki</Text>
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Info size={16} color="#777" />
          <Text style={styles.infoText}>
            Calendai v1.0.0 (Expo) • Zasilane przez Google Gemini
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8B0000',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 12,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FAF9F6',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  chipSelected: {
    backgroundColor: '#8B0000',
  },
  chipText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#8B0000',
    borderRadius: 8,
    height: 44,
    backgroundColor: 'rgba(139, 0, 0, 0.03)',
  },
  resetButtonText: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 8,
  },
});
