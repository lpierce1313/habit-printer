"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
  TextField, MenuItem, Button, IconButton, Paper, Stack, Modal,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  Delete, AddCircle, Print, ClearAll, History as HistoryIcon,
  Close, Download
} from '@mui/icons-material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { HabitPDF } from './components/habitPDF';

// --- Interfaces ---
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
  fileNamePrefix: string;
  habitsSnapshot: Habit[];
}

// --- Theme Optimized for Mobile Spacing ---
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0a0a0b', paper: '#141416' },
    primary: { main: '#4ade80' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          colorScheme: 'dark',
          height: '100dvh',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        },
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'standard', fullWidth: true },
    }
  }
});

export default function HabitApp() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [weeks, setWeeks] = useState(4);
  const [exportName, setExportName] = useState('Planner');
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Work');
  const [freq, setFreq] = useState('Everyday');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const isLoaded = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedHabits = localStorage.getItem('analog-habits-v5');
    const savedHistory = localStorage.getItem('analog-history-v5');
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem('analog-habits-v5', JSON.stringify(habits));
      localStorage.setItem('analog-history-v5', JSON.stringify(history));
    }
  }, [habits, history]);

  const toggleDay = (day: string) => {
    setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const getFullFileName = (prefix: string, date: string, w: number) => {
    const cleanPrefix = prefix.trim() || 'planner-';
    return `${cleanPrefix}${date}-${w}w.pdf`;
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

  if (!mounted) return null;

  const dateString = startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />

        {/* Main Wrapper: flex-column fills the viewport */}
        <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

          <Container maxWidth="sm" sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 1.5,
            gap: 1.5,
            overflow: 'hidden' // Prevents whole page from scrolling
          }}>

            {/* HEADER (Non-Shrinking) */}
            <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1, color: 'primary.main' }}>Your Tasks.</Typography>
              <Box>
                <IconButton size="small" onClick={() => setHistoryModalOpen(true)} sx={{ mr: 0.5 }}><HistoryIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => window.confirm("Clear list?") && setHabits([])}><ClearAll fontSize="small" /></IconButton>
              </Box>
            </Box>

            {/* FORM AREA (Non-Shrinking) */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: '#222', flexShrink: 0 }}>
              <Stack spacing={1.5}>
                <TextField
                  label="TASK NAME"
                  placeholder="e.g. Morning Yoga"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.65rem' } }}
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    select label="CATEGORY" value={category}
                    onChange={e => setCategory(e.target.value)}
                    InputLabelProps={{ shrink: true, sx: { fontSize: '0.65rem' } }}
                  >
                    {["Work", "Health", "Personal", "Home", "Finance"].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField
                    select label="FREQUENCY" value={freq}
                    onChange={e => setFreq(e.target.value)}
                    InputLabelProps={{ shrink: true, sx: { fontSize: '0.65rem' } }}
                  >
                    <MenuItem value="Everyday">Everyday</MenuItem>
                    <MenuItem value="Custom">Custom</MenuItem>
                  </TextField>
                </Stack>

                {freq === 'Custom' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(d => (
                      <Box key={d} onClick={() => toggleDay(d)}
                        sx={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid', fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer',
                          borderColor: customDays.includes(d) ? 'primary.main' : '#333',
                          bgcolor: customDays.includes(d) ? 'primary.main' : 'transparent',
                          color: customDays.includes(d) ? 'black' : 'white'
                        }}>
                        {d.charAt(0).toUpperCase()}
                      </Box>
                    ))}
                  </Box>
                )}

                <Button
                  variant="contained" fullWidth startIcon={<AddCircle />}
                  onClick={() => { if (!name) return; setHabits([...habits, { id: Date.now(), name, category, frequency: freq, customDays }]); setName(''); }}
                  sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: 900, borderRadius: 2 }}
                >
                  Add Task
                </Button>
              </Stack>
            </Paper>

            {/* TASK LIST (EXPANDS TO FILL REMAINING SPACE) */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
              <Stack spacing={1}>
                {habits.map(h => (
                  <Paper key={h.id} variant="outlined" sx={{
                    p: 1.2, display: 'flex', alignItems: 'center', bgcolor: '#0d0d0f', borderColor: '#222',
                    borderLeft: '3px solid', borderLeftColor: 'primary.main'
                  }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, color: 'primary.main' }}>
                        {h.category.toUpperCase()} • {h.frequency === 'Everyday' ? 'DAILY' : h.customDays.join(', ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" fontWeight="600">{h.name}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setHabits(habits.filter(x => x.id !== h.id))} sx={{ color: '#444' }}><Delete fontSize="inherit" /></IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* EXPORT AREA (Non-Shrinking, Fixed at Bottom) */}
            <Box sx={{ flexShrink: 0, p: 2, bgcolor: '#141416', borderRadius: 4, border: '1px solid #222' }}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <Box sx={{ flex: 0.5 }}>
                    <TextField
                      label="NAME"
                      defaultValue="Planner"
                      value={exportName} onChange={e => setExportName(e.target.value)}
                      InputLabelProps={{ sx: { fontSize: '0.65rem' } }}
                    />
                  </Box>
                  <Box sx={{ flex: 0.5 }}>
                    <TextField
                      select label="WEEKS" value={weeks} onChange={e => setWeeks(Number(e.target.value))}
                      InputLabelProps={{ sx: { fontSize: '0.65rem' } }}
                    >
                      {[1, 2, 4, 8, 12].map(w => <MenuItem key={w} value={w}>{w}w</MenuItem>)}
                    </TextField>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="START DATE" value={startDate} onChange={setStartDate}
                      slotProps={{ textField: { variant: 'standard', InputLabelProps: { shrink: true, sx: { fontSize: '0.65rem' } } } }}
                    />
                  </Box>
                  {habits.length > 0 && (
                    <PDFDownloadLink
                      document={<HabitPDF habits={habits} startDate={dateString} weeks={weeks} />}
                      fileName={getFullFileName(exportName, dateString, weeks)}
                      style={{ textDecoration: 'none' }}
                    >
                      {({ loading }) => (
                        <Button
                          variant="contained" onClick={recordExport}
                          fullWidth
                          sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold', height: 36, px: 3 }}
                        >
                          {loading ? 'Loading' : <Print />}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </Stack>
              </Stack>
            </Box>

          </Container>
        </Box>

        {/* HISTORY MODAL */}
        <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: 400, bgcolor: 'background.paper', borderRadius: 4, p: 3,
            border: '1px solid #333', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="900">History</Typography>
              <IconButton size="small" onClick={() => setHistoryModalOpen(false)}><Close /></IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {history.length === 0 ? <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Empty</Typography> : (
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
            <Button fullWidth sx={{ mt: 2 }} color="inherit" onClick={() => { if (confirm("Clear history?")) setHistory([]); }}>Clear All</Button>
          </Box>
        </Modal>

      </ThemeProvider>
    </LocalizationProvider>
  );
}