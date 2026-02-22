"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
  TextField, MenuItem, Button, IconButton, Paper, Stack, FormGroup, Modal, 
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import { 
  Delete, AddCircle, Print, ClearAll, History as HistoryIcon, 
  Close, Download 
} from '@mui/icons-material';

// Pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { HabitPDF } from './components/habitPDF';

interface Habit {
  id: number;
  name: string;
  category: string;
  frequency: string;
  customDays: string[];
}

interface ExportHistory {
  id: string;
  timestamp: string;
  startDate: string;
  weeks: number;
  fileName: string; // The custom name or "planner-"
  habitsSnapshot: Habit[];
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0a0b', paper: '#141416' },
    primary: { main: '#4ade80' },
    secondary: { main: '#f43f5e' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { colorScheme: 'dark', overflow: 'hidden', height: '100vh' },
        '*::-webkit-scrollbar': { width: '6px' },
        '*::-webkit-scrollbar-thumb': { background: '#333', borderRadius: '10px' },
      }
    }
  }
});

export default function HabitApp() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [weeks, setWeeks] = useState(4);
  const [exportName, setExportName] = useState(''); // Optional name
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [freq, setFreq] = useState('Everyday');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const isLoaded = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedHabits = localStorage.getItem('analog-habits-v4');
    const savedHistory = localStorage.getItem('analog-export-history-v3');
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem('analog-habits-v4', JSON.stringify(habits));
    }
  }, [habits]);

  // Helper to generate the unique filename
  const generateFileName = (customName: string, date: string, numWeeks: number) => {
    const base = customName.trim() ? customName.trim() : 'planner-';
    return `${base}${date}-${numWeeks}w.pdf`;
  };

  const saveToHistory = () => {
    const newEntry: ExportHistory = {
      id: Date.now().toString(),
      timestamp: dayjs().format('MMM D, h:mm A'),
      startDate: startDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      weeks,
      fileName: exportName.trim() ? exportName.trim() : 'planner-',
      habitsSnapshot: habits
    };
    const updatedHistory = [newEntry, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('analog-export-history-v3', JSON.stringify(updatedHistory));
  };

  if (!mounted) return null;

  const dateString = startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
  const finalFileName = generateFileName(exportName, dateString, weeks);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2, overflow: 'hidden' }}>

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: -1.5, color: 'primary.main' }}>Your Tasks.</Typography>
              <Box>
                <IconButton onClick={() => setHistoryModalOpen(true)} size="small" sx={{ mr: 1 }}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => window.confirm("Clear list?") && setHabits([])} size="small"><ClearAll fontSize="small" /></IconButton>
              </Box>
            </Box>

            {/* ADD TASK FORM */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3, borderColor: '#333' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="primary" fontWeight="800">TASK NAME</Typography>
                  <TextField fullWidth variant="standard" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daily Standup" />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary" fontWeight="700">CATEGORY</Typography>
                    <TextField select fullWidth variant="standard" value={category} onChange={e => setCategory(e.target.value)}>
                      {["Health", "Work", "Personal", "Home", "Finance"].map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary" fontWeight="700">FREQUENCY</Typography>
                    <TextField select fullWidth variant="standard" value={freq} onChange={e => setFreq(e.target.value)}>
                      <MenuItem value="Everyday">Everyday</MenuItem>
                      <MenuItem value="Custom">Custom Days</MenuItem>
                    </TextField>
                  </Box>
                </Box>
                {freq === 'Custom' && (
                  <FormGroup row sx={{ gap: 0.5 }}>
                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
                      <Box key={day} onClick={() => setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                        sx={{ px: 1.2, py: 0.5, borderRadius: 1, cursor: 'pointer', border: '1px solid', borderColor: customDays.includes(day) ? 'primary.main' : '#333', bgcolor: customDays.includes(day) ? 'primary.main' : 'transparent', color: customDays.includes(day) ? 'black' : 'white', fontSize: '0.6rem', fontWeight: 'bold' }}>
                        {day.toUpperCase()}
                      </Box>
                    ))}
                  </FormGroup>
                )}
                <Button variant="contained" size="large" sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: '900' }} onClick={() => {
                  if (!name.trim()) return;
                  setHabits(prev => [...prev, { id: Date.now(), name, category, frequency: freq, customDays }]);
                  setName('');
                }} startIcon={<AddCircle />}>Add to List</Button>
              </Stack>
            </Paper>

            {/* TASK LIST */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mb: 2 }}>
              <Stack spacing={1}>
                {habits.map(h => (
                  <Paper key={h.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0d0d0f', borderColor: '#222', borderLeft: `4px solid`, borderLeftColor: 'primary.dark' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.6rem', fontWeight: 'bold', color: 'primary.main', opacity: 0.8 }}>
                        {h.category.toUpperCase()} • {h.frequency === 'Everyday' ? 'DAILY' : h.customDays.join(', ').toUpperCase()}
                      </Typography>
                      <Typography variant="body1" fontWeight="600">{h.name}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setHabits(prev => prev.filter(x => x.id !== h.id))} sx={{ color: '#444' }}><Delete fontSize="small" /></IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* EXPORT CONFIG & NAME */}
            <Box sx={{ p: 2, bgcolor: '#161618', borderRadius: 3, border: '1px solid #333' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>FILE NAME (OPTIONAL)</Typography>
                  <TextField fullWidth variant="standard" value={exportName} onChange={e => setExportName(e.target.value)} placeholder="e.g. Q1-Goals" />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                  <Box sx={{ flex: 1.2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>START DATE</Typography>
                    <DatePicker value={startDate} onChange={(newValue) => setStartDate(newValue)} slotProps={{ textField: { variant: 'standard', fullWidth: true } }} />
                  </Box>
                  <Box sx={{ flex: 0.8 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>WEEKS</Typography>
                    <TextField select fullWidth variant="standard" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
                      {[1, 2, 4, 8, 12].map(num => <MenuItem key={num} value={num}>{num} Weeks</MenuItem>)}
                    </TextField>
                  </Box>
                  {habits.length > 0 && (
                    <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                      <PDFDownloadLink
                        document={<HabitPDF habits={habits} startDate={dateString} weeks={weeks} />}
                        fileName={finalFileName}
                        style={{ textDecoration: 'none' }}
                      >
                        {({ loading }) => (
                          <Button variant="contained" fullWidth onClick={saveToHistory} startIcon={<Print />} sx={{ height: 42, bgcolor: 'white', color: 'black', fontWeight: 'bold' }}>
                            {loading ? 'Loading...' : 'Export'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </Box>

            {/* HISTORY MODAL */}
            <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs: '90%', sm: 450}, maxHeight: '80vh', bgcolor: 'background.paper', borderRadius: 4, p: 3, border: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">History</Typography>
                  <IconButton onClick={() => setHistoryModalOpen(false)}><Close /></IconButton>
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  {history.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No exports found.</Typography>
                  ) : (
                    <List disablePadding>
                      {history.map((item, idx) => {
                        const historyFileName = generateFileName(item.fileName, item.startDate, item.weeks);
                        return (
                          <React.Fragment key={item.id}>
                            <ListItem sx={{ px: 0, py: 1 }} secondaryAction={
                              <PDFDownloadLink
                                document={<HabitPDF habits={item.habitsSnapshot} startDate={item.startDate} weeks={item.weeks} />}
                                fileName={historyFileName}
                              >
                                <IconButton edge="end" color="primary"><Download /></IconButton>
                              </PDFDownloadLink>
                            }>
                              <ListItemText 
                                primary={item.fileName === 'planner-' ? 'Standard Planner' : item.fileName} 
                                secondary={`${item.startDate} | ${item.weeks}w | ${item.habitsSnapshot.length} tasks`}
                                primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                                secondaryTypographyProps={{ fontSize: '0.7rem' }}
                              />
                            </ListItem>
                            {idx < history.length - 1 && <Divider sx={{ borderColor: '#222' }} />}
                          </React.Fragment>
                        );
                      })}
                    </List>
                  )}
                </Box>
                <Button fullWidth sx={{ mt: 2 }} color="inherit" onClick={() => window.confirm("Clear all history?") && setHistory([])}>Clear History</Button>
              </Box>
            </Modal>

          </Container>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}