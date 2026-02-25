import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#fff' },
  header: { marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5pt solid #000', paddingBottom: 5 },
  title: { fontSize: 22, fontWeight: 'bold', letterSpacing: -1 },
  dateInfo: { fontSize: 9, textTransform: 'uppercase' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#000', minHeight: 25 },
  tableColHeader: { width: '110pt', borderRightWidth: 0.5, borderColor: '#000', backgroundColor: '#f5f5f5', justifyContent: 'center', paddingLeft: 5 },
  dayCol: { flex: 1, borderRightWidth: 0.5, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  // Centered dash for inactive days
  inactiveDash: { fontSize: 16, color: 'black', fontWeight: 'bold' },
  cellText: { fontSize: 7, fontWeight: 'bold' },
  monthText: { fontSize: 4, color: '#666', textTransform: 'uppercase', marginBottom: 1 },
  habitName: { fontSize: 8, fontWeight: 'bold' },
  categoryText: { fontSize: 5, color: '#666', textTransform: 'uppercase', marginBottom: 1 },
  timeText: { fontSize: 6, color: '#000', fontWeight: 'bold', marginTop: 1 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, textAlign: 'center', color: '#999' }
});

interface Habit {
  id: number;
  name: string;
  category: string;
  frequency: string;
  customDays: string[];
  executionTime: string;
  isActive: boolean;
}

export const HabitPDF = ({ habits, startDate, weeks }: { habits: Habit[], startDate: string, weeks: number }) => {
  const start = dayjs(startDate);
  const weeksPerPage = 4;
  const pagesCount = Math.ceil(weeks / weeksPerPage);

  const sortedHabits = [...habits]
    .filter(h => h.isActive)
    .sort((a, b) => a.executionTime.localeCompare(b.executionTime));

  const renderPage = (pageIndex: number) => {
    const startWeekOfPage = pageIndex * weeksPerPage;
    const weeksOnThisPage = Math.min(weeksPerPage, weeks - startWeekOfPage);
    const dayLabels = Array.from({ length: weeksOnThisPage * 7 }).map((_, i) => {
      const currentDay = start.add((startWeekOfPage * 7) + i, 'day');
      return { 
        num: currentDay.format('D'), 
        month: currentDay.format('MMM'), 
        label: currentDay.format('ddd').charAt(0).toUpperCase(), 
        dayKey: currentDay.format('ddd').toLowerCase(), 
        isWeekend: [0, 6].includes(currentDay.day()) 
      };
    });

    return (
      <Page size="A4" orientation="landscape" style={styles.page} key={pageIndex}>
        <View style={styles.header}>
          <Text style={styles.title}>TASKS</Text>
          <Text style={styles.dateInfo}>{weeks} WEEK PLANNER | PAGE {pageIndex + 1}</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', minHeight: 30 }]}>
            <View style={styles.tableColHeader}><Text style={styles.cellText}>TIME / TASK</Text></View>
            {dayLabels.map((day, i) => (
              <View key={i} style={[styles.dayCol, { backgroundColor: day.isWeekend ? '#e8e8e8' : 'transparent' }]}>
                <Text style={styles.monthText}>{day.month}</Text>
                <Text style={styles.cellText}>{day.label}</Text>
                <Text style={[styles.cellText, { fontSize: 5 }]}>{day.num}</Text>
              </View>
            ))}
          </View>
          {sortedHabits.map((h) => (
            <View style={styles.tableRow} key={h.id}>
              <View style={styles.tableColHeader}>
                <Text style={styles.timeText}>{dayjs(`2024-01-01 ${h.executionTime}`).format('h:mm A')}</Text>
                <Text style={styles.categoryText}>{h.category}</Text>
                <Text style={styles.habitName}>{h.name}</Text>
              </View>
              {dayLabels.map((day, i) => {
                // Logic: Is this habit active today?
                const isScheduled = h.frequency === 'Everyday' || (h.frequency === 'Custom' && h.customDays.includes(day.dayKey));
                return (
                  <View key={i} style={styles.dayCol}>
                    {/* Render a centered dash ONLY if the habit is NOT scheduled for this day */}
                    {!isScheduled && <Text style={styles.inactiveDash}>-</Text>}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <Text style={styles.footer}>Generated {dayjs().format('MMMM DD, YYYY')} — Page {pageIndex + 1} of {pagesCount}</Text>
      </Page>
    );
  };
  return <Document>{Array.from({ length: pagesCount }).map((_, i) => renderPage(i))}</Document>;
};