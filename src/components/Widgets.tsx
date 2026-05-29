import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { List, Lightbulb, Quote, Languages } from 'lucide-react-native';

interface WidgetContainerProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ title, icon, children }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.title}>{title.toUpperCase()}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

export const NewsWidget: React.FC<{ news: string[] }> = ({ news }) => {
  return (
    <WidgetContainer
      title="AI Prasówka"
      icon={<List size={20} color="#5B8C5A" />}
    >
      <View style={styles.newsList}>
        {news.map((item, index) => (
          <View key={index} style={styles.newsItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.newsText}>{item}</Text>
          </View>
        ))}
      </View>
    </WidgetContainer>
  );
};

export const TriviaWidget: React.FC<{ trivia: string }> = ({ trivia }) => {
  return (
    <WidgetContainer
      title="Ciekawostka Dnia"
      icon={<Lightbulb size={20} color="#7E57C2" />}
    >
      <Text style={styles.bodyText}>{trivia}</Text>
    </WidgetContainer>
  );
};

export const ProverbWidget: React.FC<{ proverb: string; comment: string | null }> = ({
  proverb,
  comment,
}) => {
  return (
    <WidgetContainer
      title="Mądrość Ludowa"
      icon={<Quote size={18} color="#C64B50" />}
    >
      <View>
        <Text style={styles.proverbText}>„{proverb}”</Text>
        {comment && (
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>AI: {comment}</Text>
          </View>
        )}
      </View>
    </WidgetContainer>
  );
};

export const WordWidget: React.FC<{
  word: string;
  definition: string;
  example: string | null;
}> = ({ word, definition, example }) => {
  return (
    <WidgetContainer
      title="Słowo na Dziś"
      icon={<Languages size={20} color="#C7923E" />}
    >
      <View>
        <Text style={styles.wordTitle}>{word}</Text>
        <Text style={styles.bodyText}>{definition}</Text>
        {example && (
          <Text style={styles.wordExample}>Przykład: „{example}”</Text>
        )}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#555555',
    marginLeft: 8,
  },
  body: {
    width: '100%',
  },
  newsList: {
    width: '100%',
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B8C5A',
    marginRight: 8,
    lineHeight: 18,
  },
  newsText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  bodyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  proverbText: {
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
    color: '#C64B50',
    lineHeight: 22,
  },
  commentBox: {
    backgroundColor: 'rgba(198, 75, 80, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  commentText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
  wordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  wordExample: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666666',
    marginTop: 8,
  },
});
