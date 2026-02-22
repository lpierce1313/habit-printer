import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const styles = StyleSheet.create({
    page: { padding: 30, backgroundColor: '#fff' },
    header: { marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1.5pt solid #000', paddingBottom: 5 },
    title: { fontSize: 22, fontWeight: 'bold', letterSpacing: -1 },
    dateInfo: { fontSize: 9, textTransform: 'uppercase' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#000' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#000', minHeight: 22 },
    tableColHeader: { width: '110pt', borderRightWidth: 0.5, borderColor: '#000', backgroundColor: '#f5f5f5', justifyContent: 'center', paddingLeft: 5 },
    dayCol: { flex: 1, borderRightWidth: 0.5, borderColor: '#000', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    activeIndicator: { position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderRightWidth: 3, borderTopWidth: 3, borderRightColor: '#000', opacity: 0.8, borderTopColor: 'transparent' },
    cellText: { fontSize: 7, fontWeight: 'bold' },
    monthText: { fontSize: 4, color: '#666', textTransform: 'uppercase', marginBottom: 1 },
    choreName: { fontSize: 8, fontWeight: 'bold' },
    personText: { fontSize: 5, color: '#666', textTransform: 'uppercase', marginBottom: 1 },
    timeText: { fontSize: 5, color: '#000', fontWeight: 'bold', marginTop: 1 },

    // Stats Styles
    statsContainer: { marginTop: 20, paddingTop: 10, borderTop: '1pt solid #eee', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statBox: { padding: 5, border: '0.5pt solid #eee', width: '130pt' }, // Slightly wider for longer time strings
    statTitle: { fontSize: 6, fontWeight: 'bold', color: '#666', marginBottom: 2 },
    statValue: { fontSize: 7, fontWeight: 'bold' },

    footer: { position: 'absolute', bottom: 15, left: 30, right: 30, fontSize: 6, textAlign: 'center', color: '#999' }
});

export interface Chore {
    id: number;
    name: string;
    person: string;
    frequency: string;
    customDays: string[];
    timeEstimate: number;
}

interface Props {
    chores: Chore[];
    startDate: string;
    weeks: number;
}

/** Helper to format minutes into "X hour Y minutes" */
const formatTimeLabel = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const hLabel = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
    const mLabel = mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''}` : '';
    return [hLabel, mLabel].filter(Boolean).join(' ') || '0 minutes';
};

export const ChorePDF = ({ chores, startDate, weeks }: Props) => {
    const start = dayjs(startDate);
    const weeksPerPage = 4;
    const pagesCount = Math.ceil(weeks / weeksPerPage);

    const sortedChores = [...chores].sort((a, b) => (a.person || '').localeCompare(b.person || ''));

    // Statistics Calculation (Weighted by Frequency)
    // 1. Helper for the human-readable time
    const formatTimeLabel = (totalMinutes: number) => {
        if (totalMinutes === 0) return '0 minutes';
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const hLabel = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
        const mLabel = mins > 0 ? `${mins} minute${mins !== 1 ? 's' : ''}` : '';
        return [hLabel, mLabel].filter(Boolean).join(' ');
    };

    // 2. Inside your ChorePDF component:
    const stats = React.useMemo(() => {
        // We explicitly define the shape of our accumulator
        const personMap: Record<string, { count: number; weeklyMins: number }> = {};

        chores.forEach((chore) => {
            // Normalize: Uppercase and Trim whitespace
            const p = (chore.person || 'EVERYONE').trim().toUpperCase();

            // Calculate weight: Everyday = 7, Custom = length of array
            const occurrencesPerWeek = chore.frequency === 'Everyday' ? 7 : (chore.customDays?.length || 0);
            const minsPerWeek = occurrencesPerWeek * (Number(chore.timeEstimate) || 0);

            if (!personMap[p]) {
                personMap[p] = { count: 0, weeklyMins: 0 };
            }

            personMap[p].count += occurrencesPerWeek;
            personMap[p].weeklyMins += minsPerWeek;
        });

        const totalWeeklyMins = Object.values(personMap).reduce((sum, item) => sum + item.weeklyMins, 0);
        const totalWeeklyTasks = Object.values(personMap).reduce((sum, item) => sum + item.count, 0);

        return Object.entries(personMap).map(([name, data]) => ({
            name,
            // Calculate percentages safely to avoid NaN
            countPct: totalWeeklyTasks > 0 ? ((data.count / totalWeeklyTasks) * 100).toFixed(1) : "0.0",
            minPct: totalWeeklyMins > 0 ? ((data.weeklyMins / totalWeeklyMins) * 100).toFixed(1) : "0.0",
            formattedTime: formatTimeLabel(data.weeklyMins)
        }));
    }, [chores]); // useMemo ensures this only recalculates when chores change

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
                isWeekend: currentDay.day() === 0 || currentDay.day() === 6
            };
        });

        return (
            <Page size="A4" orientation="landscape" style={styles.page} key={pageIndex}>
                <View style={styles.header}>
                    <Text style={styles.title}>CHORES</Text>
                    <Text style={styles.dateInfo}>{weeks} WEEK PLANNER | PAGE {pageIndex + 1}</Text>
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', minHeight: 30 }]}>
                        <View style={styles.tableColHeader}><Text style={styles.cellText}>CHORE / ASSIGNED</Text></View>
                        {dayLabels.map((day, i) => (
                            <View key={i} style={[styles.dayCol, { backgroundColor: day.isWeekend ? '#e8e8e8' : 'transparent' }]}>
                                <Text style={styles.monthText}>{day.month}</Text>
                                <Text style={styles.cellText}>{day.label}</Text>
                                <Text style={[styles.cellText, { fontSize: 5 }]}>{day.num}</Text>
                            </View>
                        ))}
                    </View>

                    {sortedChores.map((chore) => (
                        <View style={styles.tableRow} key={chore.id}>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.personText}>{chore.person.toUpperCase()}</Text>
                                <Text style={styles.choreName}>{chore.name}</Text>
                                <Text style={styles.timeText}>{chore.timeEstimate} MINS</Text>
                            </View>
                            {dayLabels.map((day, i) => {
                                const isActive = chore.frequency === 'Everyday' || (chore.frequency === 'Custom' && chore.customDays.includes(day.dayKey));
                                return <View key={i} style={styles.dayCol}>{isActive && <View style={styles.activeIndicator} />}</View>;
                            })}
                        </View>
                    ))}
                </View>

                {/* Statistics breakdown only on the last page */}
                {pageIndex === pagesCount - 1 && (
                    <View style={styles.statsContainer}>
                        {stats.map(s => (
                            <View key={s.name} style={styles.statBox}>
                                <Text style={styles.statTitle}>{s.name}</Text>
                                <Text style={styles.statValue}>{s.countPct}% of Chores</Text>
                                <Text style={styles.statValue}>{s.minPct}% of Time</Text>
                                <Text style={[styles.statValue, { fontSize: 6, color: '#666' }]}>{s.formattedTime} / wk</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.footer}>Generated {dayjs().format('MMMM DD, YYYY')} — Page {pageIndex + 1} of {pagesCount}</Text>
            </Page>
        );
    };

    return <Document>{Array.from({ length: pagesCount }).map((_, i) => renderPage(i))}</Document>;
};