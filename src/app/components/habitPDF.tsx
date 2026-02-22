import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: '1.5pt solid #000',
    paddingBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -1,
  },
  dateInfo: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#000',
    minHeight: 22,
  },
  tableColHeader: {
    width: '110pt',
    borderRightWidth: 0.5,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  dayCol: {
    flex: 1,
    borderRightWidth: 0.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderRightColor: '#000',
    opacity: 0.8,
    borderTopColor: 'transparent',
  },
  cellText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 4,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  habitName: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 5,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    textAlign: 'center',
    color: '#999',
  }
});

interface Habit {
  id: number;
  name: string;
  category: string;
  frequency: string;
  customDays: string[];
}

interface Props {
  habits: Habit[];
  startDate: string;
  weeks: number;
}

export const HabitPDF = ({ habits, startDate, weeks }: Props) => {
  const start = dayjs(startDate);
  const weeksPerPage = 4;
  const pagesCount = Math.ceil(weeks / weeksPerPage);

  // Helper to differentiate similar days
  const getDayLabel = (day: string) => {
    switch (day) {
      case 'tue': return 'T';
      case 'thu': return 'Th';
      case 'sat': return 'S';
      case 'sun': return 'Su';
      default: return day.charAt(0).toUpperCase();
    }
  };

  const renderPage = (pageIndex: number) => {
    const startWeekOfPage = pageIndex * weeksPerPage;
    const weeksOnThisPage = Math.min(weeksPerPage, weeks - startWeekOfPage);
    const daysInThisPage = weeksOnThisPage * 7;
    
    const dayLabels = Array.from({ length: daysInThisPage }).map((_, i) => {
      const currentDay = start.add((startWeekOfPage * 7) + i, 'day');
      const dayKey = currentDay.format('ddd').toLowerCase();
      return {
        num: currentDay.format('D'),
        month: currentDay.format('MMM'),
        label: getDayLabel(dayKey),
        dayKey: dayKey,
        isWeekend: currentDay.day() === 0 || currentDay.day() === 6
      };
    });

    return (
      <Page size="A4" orientation="landscape" style={styles.page} key={pageIndex}>
        <View style={styles.header}>
          <Text style={styles.title}>TASKS</Text>
          <Text style={styles.dateInfo}>
            {weeks} WEEK PLANNER | PAGE {pageIndex + 1}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', minHeight: 30 }]}>
            <View style={styles.tableColHeader}>
              <Text style={styles.cellText}>TASK / HABIT</Text>
            </View>
            {dayLabels.map((day, i) => (
              <View 
                key={i} 
                style={[styles.dayCol, { backgroundColor: day.isWeekend ? '#e8e8e8' : 'transparent' }]}
              >
                <Text style={styles.monthText}>{day.month}</Text>
                <Text style={styles.cellText}>{day.label}</Text>
                <Text style={[styles.cellText, { fontSize: 5 }]}>{day.num}</Text>
              </View>
            ))}
          </View>

          {habits.map((habit) => (
            <View style={styles.tableRow} key={habit.id}>
              <View style={styles.tableColHeader}>
                <Text style={styles.categoryText}>{habit.category}</Text>
                <Text style={styles.habitName}>{habit.name}</Text>
              </View>
              {dayLabels.map((day, i) => {
                const isActive = 
                  habit.frequency === 'Everyday' || 
                  (habit.frequency === 'Custom' && habit.customDays.includes(day.dayKey));

                return (
                  <View key={i} style={styles.dayCol}>
                    {isActive && <View style={styles.activeIndicator} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated for period starting {start.format('MMMM DD, YYYY')} — Page {pageIndex + 1} of {pagesCount}
        </Text>
      </Page>
    );
  };

  return (
    <Document>
      {Array.from({ length: pagesCount }).map((_, i) => renderPage(i))}
    </Document>
  );
};