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
  },
  cellText: {
    fontSize: 7,
    fontWeight: 'bold',
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
}

interface Props {
  habits: Habit[];
  startDate: string;
  weeks: number; // This is now strictly enforced
}

export const HabitPDF = ({ habits, startDate, weeks }: Props) => {
  const start = dayjs(startDate);
  
  // We strictly limit the columns per page to 4 weeks (28 days)
  // to prevent the "squashed" UI look.
  const weeksPerPage = 4;
  const pagesCount = Math.ceil(weeks / weeksPerPage);

  const renderPage = (pageIndex: number) => {
    // Determine how many weeks belong on THIS specific page
    const startWeekOfPage = pageIndex * weeksPerPage;
    const weeksOnThisPage = Math.min(weeksPerPage, weeks - startWeekOfPage);
    const daysInThisPage = weeksOnThisPage * 7;
    
    const dayLabels = Array.from({ length: daysInThisPage }).map((_, i) => {
      const currentDay = start.add((startWeekOfPage * 7) + i, 'day');
      return {
        num: currentDay.format('D'),
        label: currentDay.format('dd').charAt(0),
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
          {/* Header Row */}
          <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', minHeight: 25 }]}>
            <View style={styles.tableColHeader}>
              <Text style={styles.cellText}>TASK / HABIT</Text>
            </View>
            {dayLabels.map((day, i) => (
              <View 
                key={i} 
                style={[styles.dayCol, { backgroundColor: day.isWeekend ? '#e8e8e8' : 'transparent' }]}
              >
                <Text style={styles.cellText}>{day.label}</Text>
                <Text style={[styles.cellText, { fontSize: 5 }]}>{day.num}</Text>
              </View>
            ))}
          </View>

          {/* Habit Rows */}
          {habits.map((habit) => (
            <View style={styles.tableRow} key={habit.id}>
              <View style={styles.tableColHeader}>
                <Text style={styles.categoryText}>{habit.category}</Text>
                <Text style={styles.habitName}>{habit.name}</Text>
              </View>
              {dayLabels.map((_, i) => (
                <View key={i} style={styles.dayCol} />
              ))}
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