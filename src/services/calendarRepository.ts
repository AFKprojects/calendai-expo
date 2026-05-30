import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import namedaysData from '../../assets/namedays.json';

// Types
export interface HourlyWidgetContent {
  hour: number;
  news: string[];
  trivia: string | null;
  proverb: string | null;
  proverbComment: string | null;
  word: string | null;
  wordDefinition: string | null;
  wordExample: string | null;
}

export interface CalendarDay {
  dateString: string;      // Format: YYYY-MM-DD
  dayOfWeek: string;       // e.g. "Piątek"
  dayOfMonth: string;      // e.g. "29"
  monthName: string;       // e.g. "maja"
  yearString: string;      // e.g. "2026"
  namedays: string[];      // e.g. ["Magdalena", "Maksymilian"]
  holiday: string | null;  // e.g. "Dzień Matki"
  hourlyWidgets: Record<number, HourlyWidgetContent>;
}

export interface ChatMessage {
  id: string;
  userName: string;
  message: string;
  timestamp: string;
  date: string;
}

const archiveDir = `${FileSystem.documentDirectory}archive/`;
const cacheDir = `${FileSystem.documentDirectory}cache/`;
const namedaysMap = namedaysData as Record<string, string[]>;

// Helper to ensure directories exist
export const initFileSystem = async () => {
  try {
    const archiveInfo = await FileSystem.getInfoAsync(archiveDir);
    if (!archiveInfo.exists) {
      await FileSystem.makeDirectoryAsync(archiveDir, { intermediates: true });
    }
    const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!cacheInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing file system:', error);
  }
};

// Replicate Kotlin's stable string hashing
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// Local mock data generator for offline/fallback mode
export const generateHourlyContent = (dateStr: string, hour: number): HourlyWidgetContent => {
  const seed = hashCode(dateStr) + hour;
  const topics = [
    "Nowe Technologie", 
    "Psychologia", 
    "Historia Świata", 
    "Astronomia i Kosmos", 
    "Przyroda i Ekologia", 
    "Sztuka i Literatura"
  ];
  const topic = topics[Math.abs(seed) % topics.length];

  let news: string[] = [];
  if (topic === "Nowe Technologie") {
    news = [
      "Gemini AI wprowadza nowy model przetwarzania obrazu w czasie rzeczywistym.",
      "Nowy przełom w akumulatorach sodowych obiecuje 2-krotnie dłuższą żywotność smartfonów.",
      "Komputery kwantowe zaczynają rozwiązywać praktyczne problemy chemiczne."
    ];
  } else if (topic === "Historia Świata") {
    news = [
      "Archeolodzy odkryli nieznaną dotąd komnatę w piramidzie Cheopsa.",
      "W archiwum w Krakowie odnaleziono zaginiony list Mikołaja Kopernika.",
      "Nowe badania rzucają inne światło na przyczyny upadku Cesarstwa Rzymskiego."
    ];
  } else {
    news = [
      "Naukowcy odkryli nowy gatunek głębinowy świecący na szkarłatno.",
      "Sonda kosmiczna przesłała najdokładniejsze w historii zdjęcia pierścieni Saturna.",
      "Odkryto nową metodę szybkiej nauki języków obcych opartą na neuroplastyczności."
    ];
  }

  let trivia = "Miodu nie da się zepsuć. W egipskich grobowcach znaleziono miód sprzed 3000 lat, który wciąż nadaje się do spożycia.";
  if (topic === "Nowe Technologie") {
    trivia = "Pierwszy dysk twardy o pojemności 1 GB został zaprezentowany przez IBM w 1980 roku. Ważył około 250 kg i miał wielkość lodówki.";
  } else if (topic === "Astronomia i Kosmos") {
    trivia = "Jeden dzień na Wenus (czas jej pełnego obrotu wokół własnej osi) jest dłuższy niż cały wenusjański rok (czas obiegu wokół Słońca).";
  } else if (topic === "Historia Świata") {
    trivia = "W średniowieczu cukier był tak drogi i luksusowy, że nazywano go 'białym złotem' i zamykano w specjalnych szkatułkach na klucz.";
  }

  const proverbs = [
    { proverb: "Kto rano wstaje, temu Pan Bóg daje.", comment: "Tradycyjna zachęta do pracowitości. AI podpowiada: albo temu Pan Bóg daje... więcej kawy do wypicia rano." },
    { proverb: "Gdy na świętego Prota jest deszcz lub słota, to do Bożego Narodzenia zima jest gotowa.", comment: "Prognoza pogody naszych przodków. Współczesne AI: brzmi jak wczesny model predykcyjny oparty na małej próbie danych." },
    { proverb: "Co masz zrobić jutro, zrób dziś.", comment: "Klasyczny lek na prokrastynację. AI dodaje: ...a jutro będziesz mieć wolne na naukę nowych technologii!" },
    { proverb: "Bez pracy nie ma kołaczy.", comment: "Osiągnięcie sukcesu wymaga wysiłku. AI: niestety, nawet przy wsparciu AI kod nie napisze się w pełni sam (jeszcze)." }
  ];
  const selectedProverb = proverbs[Math.abs(seed) % proverbs.length];

  const words = [
    { word: "Efemeryczny", definition: "Krótkotrwały, szybko przemijający, mający charakter przejściowy.", example: "Efemeryczny zachwyt nową technologią szybko ustąpił miejsca codziennej rutynie." },
    { word: "Serendyptyczność", definition: "Zdolność do dokonywania szczęśliwych i niespodziewanych odkryć przez przypadek.", example: "Odkrycie penicyliny było czystym przykładem serendyptyczności." },
    { word: "Gnoza", definition: "Wiedza duchowa, intuicyjne poznanie prawd nadprzyrodzonych.", example: "Stare traktaty pełne były gnozy i mistycznych symboli." },
    { word: "Flanować", definition: "Spacerować bez celu, przyglądając się miejskiemu życiu.", example: "W ciepłe popołudnie najlepiej jest flanować po uliczkach krakowskiego Kazimierza." }
  ];
  const selectedWord = words[Math.abs(seed) % words.length];

  return {
    hour,
    news,
    trivia,
    proverb: selectedProverb.proverb,
    proverbComment: selectedProverb.comment,
    word: selectedWord.word,
    wordDefinition: selectedWord.definition,
    wordExample: selectedWord.example
  };
};

// Namedays lookup helper
const getNamedays = (month: number, day: number): string[] => {
  const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return namedaysMap[key] || [];
};

// Holidays lookup helper
const getHoliday = (month: number, day: number): string | null => {
  const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  switch (key) {
    case "01-01": return "Nowy Rok / Święto Bożej Rodzicielki";
    case "01-06": return "Święto Trzech Króli";
    case "05-01": return "Święto Pracy";
    case "05-02": return "Dzień Flagi Rzeczypospolitej Polskiej";
    case "05-03": return "Święto Konstytucji 3 Maja";
    case "05-26": return "Dzień Matki";
    case "06-01": return "Międzynarodowy Dzień Dziecka";
    case "08-15": return "Wniebowzięcie NMP / Święto Wojska Polskiego";
    case "10-14": return "Dzień Edukacji Narodowej (Dzień Nauczyciela)";
    case "11-01": return "Wszystkich Świętych";
    case "11-11": return "Narodowe Święto Niepodległości";
    case "12-24": return "Wigilia Bożego Narodzenia";
    case "12-25": return "Boże Narodzenie (Pierwszy Dzień)";
    case "12-26": return "Boże Narodzenie (Drugi Dzień / Św. Szczepana)";
    default: return null;
  }
};

// Generate base calendar day metadata (Polish dates and namedays)
export const generateBaseDay = (dateStr: string): Omit<CalendarDay, 'hourlyWidgets'> => {
  const date = new Date(dateStr);
  
  // Format day of week in Polish, capitalize first letter
  const dayOfWeekFormatter = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' });
  const rawDayOfWeek = dayOfWeekFormatter.format(date);
  const dayOfWeek = rawDayOfWeek.charAt(0).toUpperCase() + rawDayOfWeek.slice(1);

  // Day of month and year
  const dayOfMonth = date.getDate().toString();
  const yearString = date.getFullYear().toString();

  // Month name in Polish, lowercase
  const monthNameFormatter = new Intl.DateTimeFormat('pl-PL', { month: 'long' });
  const monthName = monthNameFormatter.format(date).toLowerCase();

  const monthNum = date.getMonth() + 1;
  const dayNum = date.getDate();

  const namedays = getNamedays(monthNum, dayNum);
  const holiday = getHoliday(monthNum, dayNum);

  return {
    dateString: dateStr,
    dayOfWeek,
    dayOfMonth,
    monthName,
    yearString,
    namedays,
    holiday
  };
};

// Auth helper mirroring Kotlin's UUID registration and login
export const getAuthenticatedSession = async (): Promise<{ userId: string; token: string } | null> => {
  try {
    const savedEmail = await AsyncStorage.getItem('supabase_email');
    const savedPassword = await AsyncStorage.getItem('supabase_password');
    const currentNickname = (await AsyncStorage.getItem('chat_nickname')) || 'Anonim';

    if (!savedEmail || !savedPassword) {
      // Replicate: Register a new user
      const userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const email = `${userId}@calendai.com`;
      const password = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10); // Stable random password

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: currentNickname
          }
        }
      });

      if (error || !data.user || !data.session) {
        console.warn('Error signing up in Supabase:', error);
        return null;
      }

      await AsyncStorage.setItem('supabase_email', email);
      await AsyncStorage.setItem('supabase_password', password);
      await AsyncStorage.setItem('supabase_user_id', data.user.id);
      await AsyncStorage.setItem('supabase_access_token', data.session.access_token);

      return { userId: data.user.id, token: data.session.access_token };
    } else {
      // Replicate: Log in existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: savedEmail,
        password: savedPassword
      });

      if (error) {
        console.warn('Error logging in to Supabase:', error);
        // Clear if credentials unauthorized to trigger signup next time
        if (error.status === 400 || error.status === 401) {
          await AsyncStorage.removeItem('supabase_email');
          await AsyncStorage.removeItem('supabase_password');
        }
        return null;
      }

      if (data.user && data.session) {
        await AsyncStorage.setItem('supabase_user_id', data.user.id);
        await AsyncStorage.setItem('supabase_access_token', data.session.access_token);
        return { userId: data.user.id, token: data.session.access_token };
      }
      return null;
    }
  } catch (error) {
    console.warn('Auth error:', error);
    return null;
  }
};

// Sync profile settings with Supabase
export const syncUserProfile = async (nickname: string, selectedTopics?: string[]): Promise<boolean> => {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return false;

    const topicsSet = selectedTopics 
      ? selectedTopics 
      : JSON.parse((await AsyncStorage.getItem('selected_topics')) || '["Nowe Technologie", "Historia Świata", "Psychologia"]');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        nickname,
        selected_topics: topicsSet,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.userId);

    if (error) {
      console.error('Error syncing profile:', error);
      return false;
    }

    await AsyncStorage.setItem('last_synced_nickname', nickname);
    await AsyncStorage.setItem('last_synced_topics', JSON.stringify(topicsSet));
    return true;
  } catch (error) {
    console.error('Sync profile error:', error);
    return false;
  }
};

const syncProfileIfNeeded = async (userId: string) => {
  const nickname = (await AsyncStorage.getItem('chat_nickname')) || 'Anonim';
  const topicsStr = await AsyncStorage.getItem('selected_topics');
  const topics = topicsStr ? JSON.parse(topicsStr) : ["Nowe Technologie", "Historia Świata", "Psychologia"];

  const lastSyncedNickname = await AsyncStorage.getItem('last_synced_nickname');
  const lastSyncedTopicsStr = await AsyncStorage.getItem('last_synced_topics');
  const lastSyncedTopics = lastSyncedTopicsStr ? JSON.parse(lastSyncedTopicsStr) : null;

  const topicsChanged = !lastSyncedTopics || JSON.stringify(topics.sort()) !== JSON.stringify(lastSyncedTopics.sort());

  if (nickname !== lastSyncedNickname || topicsChanged) {
    await syncUserProfile(nickname, topics);
  }
};

// Fetch widgets for a given day with remote / local / mock cascading
export const fetchHourlyWidgets = async (dateStr: string): Promise<Record<number, HourlyWidgetContent>> => {
  const cacheFile = `${cacheDir}today_${dateStr}.json`;
  
  const topicsStr = await AsyncStorage.getItem('selected_topics');
  const selectedTopics: string[] = topicsStr ? JSON.parse(topicsStr) : ["Nowe Technologie", "Historia Świata", "Psychologia"];

  // 1. Try to fetch from Supabase
  try {
    const session = await getAuthenticatedSession();
    if (session) {
      await syncProfileIfNeeded(session.userId);
    }

    const { data: dtoList, error } = await supabase
      .from('hourly_content')
      .select('*')
      .eq('date', dateStr);

    if (!error && dtoList && dtoList.length > 0) {
      const widgetMap: Record<number, HourlyWidgetContent> = {};
      
      // Group by hour
      const hourlyGroups: Record<number, any[]> = {};
      dtoList.forEach(item => {
        if (!hourlyGroups[item.hour]) {
          hourlyGroups[item.hour] = [];
        }
        hourlyGroups[item.hour].push(item);
      });

      for (let hour = 0; hour <= 23; hour++) {
        const group = hourlyGroups[hour];
        if (!group) continue;

        // Filter group by user's selected topics
        const matchedList = group.filter(item => selectedTopics.includes(item.category));
        
        let selectedDto = null;
        if (matchedList.length > 0) {
          const seed = hashCode(dateStr) + hour;
          selectedDto = matchedList[Math.abs(seed) % matchedList.length];
        } else if (group.length > 0) {
          selectedDto = group[0];
        }

        if (selectedDto) {
          widgetMap[hour] = {
            hour: selectedDto.hour,
            news: selectedDto.news || [],
            trivia: selectedDto.trivia,
            proverb: selectedDto.proverb,
            proverbComment: selectedDto.proverb_comment,
            word: selectedDto.word,
            wordDefinition: selectedDto.word_definition,
            wordExample: selectedDto.word_example
          };
        }
      }

      if (Object.keys(widgetMap).length > 0) {
        try {
          await FileSystem.writeAsStringAsync(cacheFile, JSON.stringify(widgetMap));
        } catch (e) {
          console.error('Cache write failed:', e);
        }
        return widgetMap;
      }
    }
  } catch (error) {
    console.warn('Supabase fetch hourly content error:', error);
  }

  // 2. Try cache
  try {
    const fileInfo = await FileSystem.getInfoAsync(cacheFile);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(cacheFile);
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Cache read failed:', e);
  }

  // 3. Fallback: generate local mock widgets
  const widgetMap: Record<number, HourlyWidgetContent> = {};
  for (let h = 0; h <= 23; h++) {
    widgetMap[h] = generateHourlyContent(dateStr, h);
  }
  return widgetMap;
};

// Repository API

export const getCalendarDay = async (dateStr: string): Promise<CalendarDay> => {
  await initFileSystem();
  
  // 1. Try to load from archive if it was already torn off
  const archivedFile = `${archiveDir}${dateStr}.json`;
  try {
    const archivedInfo = await FileSystem.getInfoAsync(archivedFile);
    if (archivedInfo.exists) {
      const content = await FileSystem.readAsStringAsync(archivedFile);
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Archive read failed:', e);
  }

  // 2. Load metadata + fetch widgets
  const baseDay = generateBaseDay(dateStr);
  const widgets = await fetchHourlyWidgets(dateStr);
  return {
    ...baseDay,
    hourlyWidgets: widgets
  };
};

export const isTornOff = async (dateStr: string): Promise<boolean> => {
  const lastTornDate = await AsyncStorage.getItem('last_torn_date');
  if (lastTornDate === dateStr) return true;

  const archivedFile = `${archiveDir}${dateStr}.json`;
  const info = await FileSystem.getInfoAsync(archivedFile);
  return info.exists;
};

export const markAsTornOff = async (dateStr: string, day: CalendarDay) => {
  try {
    await initFileSystem();
    await AsyncStorage.setItem('last_torn_date', dateStr);
    
    const archivedFile = `${archiveDir}${dateStr}.json`;
    await FileSystem.writeAsStringAsync(archivedFile, JSON.stringify(day));
  } catch (error) {
    console.error('Error marking as torn off:', error);
  }
};

export const deleteDayFromArchive = async (dateStr: string) => {
  try {
    await initFileSystem();
    const archivedFile = `${archiveDir}${dateStr}.json`;
    const cacheFile = `${cacheDir}today_${dateStr}.json`;

    const archivedInfo = await FileSystem.getInfoAsync(archivedFile);
    if (archivedInfo.exists) {
      await FileSystem.deleteAsync(archivedFile);
    }

    const cacheInfo = await FileSystem.getInfoAsync(cacheFile);
    if (cacheInfo.exists) {
      await FileSystem.deleteAsync(cacheFile);
    }

    const lastTornDate = await AsyncStorage.getItem('last_torn_date');
    if (lastTornDate === dateStr) {
      await AsyncStorage.removeItem('last_torn_date');
    }
  } catch (error) {
    console.warn('Error deleting day from archive:', error);
  }
};


export const getArchive = async (): Promise<CalendarDay[]> => {
  try {
    await initFileSystem();
    const files = await FileSystem.readDirectoryAsync(archiveDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const list: CalendarDay[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await FileSystem.readAsStringAsync(`${archiveDir}${file}`);
        list.push(JSON.parse(content));
      } catch (err) {
        console.error(`Error reading archive file ${file}:`, err);
      }
    }
    return list.sort((a, b) => b.dateString.localeCompare(a.dateString));
  } catch (error) {
    console.error('Error reading archive:', error);
    return [];
  }
};

// Retrieve chat messages with a Realtime subscription and initial fetch
export const subscribeToChatMessages = (
  dateStr: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void => {
  let isMounted = true;
  
  // 1. Initial Fetch
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_chat')
        .select('*')
        .eq('date', dateStr)
        .order('timestamp', { ascending: true });

      if (!error && data && isMounted) {
        const domainMsgs: ChatMessage[] = data.map(item => ({
          id: item.id,
          userName: item.user_name,
          message: item.message,
          timestamp: item.timestamp,
          date: item.date
        }));
        onUpdate(domainMsgs);
      }
    } catch (e) {
      console.warn('Error fetching chat messages:', e);
    }
  };

  fetchMessages();

  // 2. Realtime Channel Subscription
  const channel = supabase
    .channel(`daily_chat_room:${dateStr}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'daily_chat',
        filter: `date=eq.${dateStr}`
      },
      (payload) => {
        console.log('Realtime chat message received:', payload.new);
        // Refresh list on new message insertion
        fetchMessages();
      }
    )
    .subscribe();

  // Return unsubscribe cleanup function
  return () => {
    isMounted = false;
    supabase.removeChannel(channel);
  };
};

export const sendChatMessage = async (dateStr: string, userName: string, text: string): Promise<boolean> => {
  try {
    const session = await getAuthenticatedSession();
    if (!session) return false;

    // Sync nickname
    await syncUserProfile(userName);

    const { error } = await supabase.from('daily_chat').insert({
      user_id: session.userId,
      user_name: userName,
      message: text,
      date: dateStr
    });

    if (error) {
      console.warn('Error sending chat message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Send chat error:', error);
    return false;
  }
};
