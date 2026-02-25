"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
  TextField, MenuItem, Button, IconButton, Paper, Stack, Modal,
  List, ListItem, ListItemText, Divider, Checkbox
} from '@mui/material';
import {
  Delete, AddCircle, Print, ClearAll, History as HistoryIcon,
  Close, Download, Edit, Save
} from '@mui/icons-material';

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
  executionTime: string;
  isActive: boolean;
}

interface ExportHistory {
  id: string;
  timestamp: string;
  startDate: string;
  weeks: number;
  fileNamePrefix: string;
  habitsSnapshot: Habit[];
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0a0b', paper: '#141416' },
    primary: { main: '#4ade80' },
  },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { colorScheme: 'dark', height: '100dvh', margin: 0, padding: 0, overflow: 'hidden' } } },
    MuiTextField: { defaultProps: { variant: 'standard', fullWidth: true } }
  }
});

export default function HabitApp() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [weeks, setWeeks] = useState(4);
  const [exportName, setExportName] = useState('Planner');
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Work');
  const [freq, setFreq] = useState('Everyday');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [execTime, setExecTime] = useState('09:00');

  const [mounted, setMounted] = useState(false);
  const isLoaded = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedHabits = localStorage.getItem('habit-app-v11');
    const savedHistory = localStorage.getItem('habit-history-v11');
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem('habit-app-v11', JSON.stringify(habits));
      localStorage.setItem('habit-history-v11', JSON.stringify(history));
    }
  }, [habits, history]);

  // Restored FileName Logic
  const getFullFileName = (prefix: string, date: string, w: number) => {
    const cleanPrefix = prefix.trim() || 'planner-';
    return `${cleanPrefix}${date}-${w}w.pdf`;
  };

  const addHabit = () => {
    if (!name) return;
    const newHabit: Habit = {
      id: Date.now(),
      name: name.toUpperCase().trim(),
      category: category.toUpperCase(),
      frequency: freq,
      customDays,
      executionTime: execTime,
      isActive: true
    };
    setHabits([...habits, newHabit]);
    setName(''); setCustomDays([]);
  };

  const recordExport = () => {
    const entry: ExportHistory = {
      id: Date.now().toString(),
      timestamp: dayjs().format('MMM D, h:mm A'),
      startDate: startDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      weeks,
      fileNamePrefix: exportName.trim() || 'planner-',
      habitsSnapshot: [...habits]
    };
    setHistory(prev => [entry, ...prev].slice(0, 15));
  };

  const sortedHabits = useMemo(() => 
    [...habits].sort((a, b) => a.executionTime.localeCompare(b.executionTime)),
  [habits]);

  if (!mounted) return null;
  const dateString = startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ height: 'calc(100dvh - 65px)', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, gap: 1.5, overflow: 'hidden' }}>
            
            <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1, color: 'primary.main' }}>Your Tasks.</Typography>
              <Box>
                <IconButton size="small" onClick={() => setHistoryModalOpen(true)} sx={{ mr: 0.5 }}><HistoryIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => window.confirm("Clear list?") && setHabits([])}><ClearAll fontSize="small" /></IconButton>
              </Box>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: '#222', flexShrink: 0 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2}>
                  <TextField label="TASK NAME" value={name} onChange={e => setName(e.target.value)} />
                  <TextField label="TIME" type="time" value={execTime} onChange={e => setExecTime(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 100 }} />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField select label="CATEGORY" value={category} onChange={e => setCategory(e.target.value)}>
                    {["Work", "Health", "Personal", "Home"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField select label="FREQ" value={freq} onChange={e => setFreq(e.target.value)}>
                    <MenuItem value="Everyday">Everyday</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </TextField>
                </Stack>
                {freq === 'Custom' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(d => (
                      <Box key={d} onClick={() => setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                        sx={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid', borderColor: customDays.includes(d) ? 'primary.main' : '#333', bgcolor: customDays.includes(d) ? 'primary.main' : 'transparent', color: customDays.includes(d) ? 'black' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                        {d.charAt(0).toUpperCase()}
                      </Box>
                    ))}
                  </Box>
                )}
                <Button variant="contained" fullWidth startIcon={<AddCircle />} onClick={addHabit} sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: 900 }}>Add Task</Button>
              </Stack>
            </Paper>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Stack spacing={1}>
                {sortedHabits.map(h => (
                  <Paper key={h.id} variant="outlined" sx={{ p: 1.2, display: 'flex', alignItems: 'center', bgcolor: h.isActive ? '#0d0d0f' : '#050505', borderColor: '#222', borderLeft: '3px solid', borderLeftColor: h.isActive ? 'primary.main' : '#333', opacity: h.isActive ? 1 : 0.6 }}>
                    <Checkbox size="small" checked={h.isActive} onChange={() => setHabits(habits.map(x => x.id === h.id ? {...x, isActive: !x.isActive} : x))} />
                    
                    {editingId === h.id ? (
                      <Stack spacing={1.5} sx={{ flexGrow: 1, px: 1 }}>
                        <TextField size="small" value={h.name} onChange={e => setHabits(habits.map(x => x.id === h.id ? {...x, name: e.target.value.toUpperCase()} : x))} />
                        <Stack direction="row" spacing={1}>
                          <TextField size="small" type="time" value={h.executionTime} onChange={e => setHabits(habits.map(x => x.id === h.id ? {...x, executionTime: e.target.value} : x))} />
                          <TextField select size="small" value={h.category} onChange={e => setHabits(habits.map(x => x.id === h.id ? {...x, category: e.target.value} : x))}>
                            {["Work", "Health", "Personal", "Home"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </TextField>
                          <IconButton size="small" onClick={() => setEditingId(null)} color="primary"><Save fontSize="small" /></IconButton>
                        </Stack>
                      </Stack>
                    ) : (
                      <Box sx={{ flexGrow: 1, ml: 1 }}>
                        <Typography sx={{ fontSize: '0.55rem', fontWeight: '800', color: 'primary.main' }}>
                          {dayjs(`2024-01-01 ${h.executionTime}`).format('h:mm A')} • {h.category}
                        </Typography>
                        <Typography variant="body2" fontWeight="600">{h.name}</Typography>
                      </Box>
                    )}
                    <IconButton size="small" onClick={() => setEditingId(h.id)} sx={{ color: '#444' }}><Edit fontSize="inherit" /></IconButton>
                    <IconButton size="small" onClick={() => setHabits(habits.filter(x => x.id !== h.id))} sx={{ color: '#444' }}><Delete fontSize="inherit" /></IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* RESTORED EXPORT AREA WITH FILENAME CODE */}
            <Box sx={{ flexShrink: 0, p: 2, bgcolor: '#141416', borderRadius: 4, border: '1px solid #222' }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField label="FILE NAME" value={exportName} onChange={e => setExportName(e.target.value)} />
                  <TextField select label="WEEKS" value={weeks} onChange={e => setWeeks(Number(e.target.value))} sx={{ width: 80 }}>
                    {[1, 2, 4, 8, 12].map(w => <MenuItem key={w} value={w}>{w}w</MenuItem>)}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <DatePicker label="START DATE" value={startDate} onChange={setStartDate} slotProps={{ textField: { variant: 'standard' } }} />
                  {habits.length > 0 && (
                    <PDFDownloadLink 
                      document={<HabitPDF habits={habits} startDate={dateString} weeks={weeks} />} 
                      fileName={getFullFileName(exportName, dateString, weeks)}
                    >
                      {({ loading }) => (
                        <Button variant="contained" onClick={recordExport} sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold' }}>
                          {loading ? '...' : <Print />}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Container>
        </Box>

        {/* RESTORED HISTORY MODAL WITH FILENAME CODE */}
        <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 400, bgcolor: 'background.paper', borderRadius: 4, p: 3, border: '1px solid #333', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="900">History</Typography>
              <IconButton size="small" onClick={() => setHistoryModalOpen(false)}><Close /></IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {history.length === 0 ? <Typography align="center" color="text.secondary" py={4}>Empty</Typography> : (
                <List disablePadding>
                  {history.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <ListItem disableGutters secondaryAction={
                        <PDFDownloadLink 
                          document={<HabitPDF habits={item.habitsSnapshot} startDate={item.startDate} weeks={item.weeks} />} 
                          fileName={getFullFileName(item.fileNamePrefix, item.startDate, item.weeks)}
                        >
                          <IconButton size="small" color="primary"><Download fontSize="small" /></IconButton>
                        </PDFDownloadLink>
                      }>
                        <ListItemText 
                          primary={item.fileNamePrefix === 'planner-' ? 'Standard' : item.fileNamePrefix} 
                          secondary={`${item.startDate} • ${item.weeks}w • ${item.timestamp}`} 
                          primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.85rem' }} 
                          secondaryTypographyProps={{ fontSize: '0.7rem' }} 
                        />
                      </ListItem>
                      {idx < history.length - 1 && <Divider sx={{ borderColor: '#222' }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
            <Button fullWidth sx={{ mt: 2 }} color="inherit" onClick={() => confirm("Clear history?") && setHistory([])}>Clear All</Button>
          </Box>
        </Modal>

      </ThemeProvider>
    </LocalizationProvider>
  );
}