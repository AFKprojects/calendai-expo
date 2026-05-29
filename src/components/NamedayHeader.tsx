import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarDay } from '../services/calendarRepository';

interface NamedayHeaderProps {
  day: CalendarDay;
}

export const NamedayHeader: React.FC<NamedayHeaderProps> = ({ day }) => {
  const isSundayOrHoliday = 
    day.dayOfWeek.toLowerCase() === 'niedziela' || 
    day.holiday !== null;

  const primaryColor = isSundayOrHoliday ? '#8B0000' : '#2C2C2C';

  return (
    <View style={styles.headerContainer}>
      {/* Traditional top clasp (metal hanger bar of a tear-off calendar) */}
      <View style={styles.metalClasp}>
        <View style={styles.screwHole} />
        <Text style={styles.claspText}>CALENDAI</Text>
        <View style={styles.screwHole} />
      </View>

      <View style={styles.content}>
        {/* Month and Year */}
        <Text style={styles.monthYearText}>
          {day.monthName.toUpperCase()} {day.yearString}
        </Text>

        {/* Big day number */}
        <Text style={[styles.dayNumberText, { color: primaryColor }]}>
          {day.dayOfMonth}
        </Text>

        {/* Day of week */}
        <Text style={[styles.dayOfWeekText, { color: primaryColor }]}>
          {day.dayOfWeek.toUpperCase()}
        </Text>

        {/* Divider line */}
        <View style={styles.divider} />

        {/* Name days */}
        {day.namedays && day.namedays.length > 0 && (
          <View style={styles.namedaysContainer}>
            <Text style={styles.namedaysTitle}>IMIENINY</Text>
            <Text style={styles.namedaysList}>
              {day.namedays.join(', ')}
            </Text>
          </View>
        )}

        {/* Holiday banner if any */}
        {day.holiday && (
          <View style={styles.holidayBanner}>
            <Text style={styles.holidayText}>
              {day.holiday.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: '#FCF9F2',
    paddingBottom: 16,
  },
  metalClasp: {
    width: '100%',
    height: 30,
    backgroundColor: '#424242',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  screwHole: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#212121',
  },
  claspText: {
    color: '#B0BEC5',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: {
    alignItems: 'center',
    paddingTop: 16,
  },
  monthYearText: {
    color: '#7F7F7F',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  dayNumberText: {
    fontSize: 90,
    fontWeight: '900',
    lineHeight: 95,
    textAlign: 'center',
  },
  dayOfWeekText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  divider: {
    width: '85%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 12,
  },
  namedaysContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  namedaysTitle: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  namedaysList: {
    color: '#444444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 20,
  },
  holidayBanner: {
    width: '85%',
    backgroundColor: 'rgba(139, 0, 0, 0.08)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  holidayText: {
    color: '#8B0000',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
