"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
  TextField, MenuItem, Button, IconButton, Paper, Stack, FormGroup
} from '@mui/material';
import { Delete, AddCircle, Print, ClearAll } from '@mui/icons-material';

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
  const [weeks, setWeeks] = useState(4); // Default 4 weeks
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [freq, setFreq] = useState('Everyday');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const isLoaded = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('analog-habits-v4');
    if (saved) setHabits(JSON.parse(saved));
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) localStorage.setItem('analog-habits-v4', JSON.stringify(habits));
  }, [habits]);

  if (!mounted) return null;

  const dateString = startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2, overflow: 'hidden' }}>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: -1.5, color: 'primary.main' }}>Your Tasks.</Typography>
              <IconButton onClick={() => window.confirm("Clear list?") && setHabits([])} size="small" sx={{ '&:hover': { color: 'secondary.main' } }}>
                <ClearAll fontSize="small" />
              </IconButton>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3, borderColor: '#333' }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="primary" fontWeight="800">TASK NAME</Typography>
                  <TextField fullWidth variant="standard" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Daily Standup" />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">CATEGORY</Typography>
                    <TextField select fullWidth variant="standard" value={category} onChange={e => setCategory(e.target.value)}>
                      {["Health", "Work", "Personal", "Home", "Finance"].map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">FREQUENCY</Typography>
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
                        sx={{
                          px: 1.2, py: 0.5, borderRadius: 1, cursor: 'pointer', border: '1px solid',
                          borderColor: customDays.includes(day) ? 'primary.main' : '#333',
                          bgcolor: customDays.includes(day) ? 'primary.main' : 'transparent',
                          color: customDays.includes(day) ? 'black' : 'white',
                          fontSize: '0.6rem', fontWeight: 'bold'
                        }}>
                        {day.toUpperCase()}
                      </Box>
                    ))}
                  </FormGroup>
                )}

                <Button variant="contained" size="large" sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: '900' }} onClick={() => {
                   if (!name.trim()) return;
                   setHabits(prev => [...prev, { id: Date.now(), name, category, frequency: freq, customDays }]);
                   setName('');
                }} startIcon={<AddCircle />}>
                  Add to List
                </Button>
              </Stack>
            </Paper>

            <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, px: 1 }}>YOUR TASKS</Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mb: 2 }}>
              <Stack spacing={1}>
                {habits.map(h => (
                  <Paper key={h.id} variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0d0d0f', borderColor: '#222', borderLeft: `4px solid`, borderLeftColor: 'primary.dark' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'primary.main', opacity: 0.8 }}>{h.category.toUpperCase()}</Typography>
                      <Typography variant="body1" fontWeight="600">{h.name}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setHabits(prev => prev.filter(x => x.id !== h.id))} sx={{ color: '#444', '&:hover': { color: 'secondary.main', bgcolor: 'rgba(244, 63, 94, 0.1)' } }}><Delete fontSize="small" /></IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* THE DATEPICKER & WEEKS SECTION */}
            <Box sx={{ p: 2, bgcolor: '#161618', borderRadius: 3, border: '1px solid #333' }}>
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <Box sx={{ flex: 1.2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>START DATE</Typography>
                  <DatePicker 
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { variant: 'standard', fullWidth: true } }}
                  />
                </Box>

                <Box sx={{ flex: 0.8 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>WEEKS</Typography>
                  <TextField
                    select
                    fullWidth
                    variant="standard"
                    value={weeks}
                    onChange={(e) => setWeeks(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} {num === 1 ? 'Week' : 'Weeks'}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                
                {habits.length > 0 && (
                  <PDFDownloadLink
                    document={<HabitPDF habits={habits} startDate={dateString} weeks={weeks} />}
                    fileName={`planner-${dateString}-${weeks}weeks.pdf`}
                    style={{ textDecoration: 'none' }}
                  >
                    {({ loading }) => (
                      <Button variant="contained" startIcon={<Print />} sx={{ height: 36, bgcolor: 'white', color: 'black', fontWeight: 'bold' }}>
                        {loading ? 'Loading...' : 'Export'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </Stack>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}