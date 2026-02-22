"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
    TextField, MenuItem, Button, IconButton, Paper, Stack, Modal,
    ListItem, ListItemText, Divider, Autocomplete
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
import { Chore, ChorePDF } from '../components/ChorePDF';

interface HistoryEntry {
    id: string;
    timestamp: string;
    startDate: string;
    weeks: number;
    fileNamePrefix: string;
    choresSnapshot: Chore[];
}

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: { default: '#0a0a0b', paper: '#141416' },
        primary: { main: '#4ade80' },
    },
    components: {
        MuiTextField: {
            defaultProps: { variant: 'standard', fullWidth: true },
        }
    }
});

export default function ChoresPage() {
    const [chores, setChores] = useState<Chore[]>([]);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
    const [weeks, setWeeks] = useState(4);
    const [exportName, setExportName] = useState('Chores');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [person, setPerson] = useState('');
    const [freq, setFreq] = useState('Everyday');
    const [customDays, setCustomDays] = useState<string[]>([]);
    const [timeEstimate, setTimeEstimate] = useState<number | ''>('');

    const [mounted, setMounted] = useState(false);
    const isLoaded = useRef(false);

    // Get unique list of names for autocomplete
    const existingNames = useMemo(() => {
        const names = chores.map(c => c.person).filter(p => p);
        return Array.from(new Set(names));
    }, [chores]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const savedChores = localStorage.getItem('analog-chores-v1');
        const savedHistory = localStorage.getItem('chore-history-v1');
        if (savedChores) setChores(JSON.parse(savedChores));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        isLoaded.current = true;
    }, []);

    useEffect(() => {
        if (isLoaded.current) {
            localStorage.setItem('analog-chores-v1', JSON.stringify(chores));
            localStorage.setItem('chore-history-v1', JSON.stringify(history));
        }
    }, [chores, history]);

    const toggleDay = (day: string) => {
        setCustomDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleAddChore = () => {
        if (!name) return;
        const finalTime = typeof timeEstimate === 'number' ? Math.min(timeEstimate, 180) : 0;

        const newChore: Chore = {
            id: Date.now(),
            name,
            person: person.trim() || 'Everyone',
            frequency: freq,
            customDays,
            timeEstimate: finalTime
        };

        setChores([...chores, newChore]);
        setName('');
        setPerson('');
        setTimeEstimate('');
    };

    const recordExport = () => {
        const entry: HistoryEntry = {
            id: Date.now().toString(),
            timestamp: dayjs().format('MMM D, h:mm A'),
            startDate: startDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
            weeks,
            fileNamePrefix: exportName.trim() || 'chores',
            choresSnapshot: [...chores]
        };
        setHistory(prev => [entry, ...prev].slice(0, 15));
    };

    if (!mounted) return null;

    const dateString = startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Box sx={{ height: 'calc(100dvh - 65px)', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                    <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, pb: 1, gap: 1.5, overflow: 'hidden' }}>

                        {/* HEADER */}
                        <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: -1, color: 'primary.main' }}>Your Chores.</Typography>
                            <Box>
                                <IconButton size="small" onClick={() => setHistoryModalOpen(true)} sx={{ mr: 0.5 }}><HistoryIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => window.confirm("Clear chores?") && setChores([])}><ClearAll fontSize="small" /></IconButton>
                            </Box>
                        </Box>

                        {/* FORM AREA */}
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: '#222', flexShrink: 0 }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="CHORE NAME"
                                        placeholder="Vacuuming"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.65rem' } }}
                                    />
                                    <TextField
                                        label="MINS"
                                        type="number"
                                        placeholder="15"
                                        value={timeEstimate}
                                        onChange={e => {
                                            const val = e.target.value === '' ? '' : Math.min(parseInt(e.target.value), 180);
                                            setTimeEstimate(val as number | '');
                                        }}
                                        sx={{ width: '100px' }}
                                        InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.65rem' } }}
                                    />
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
                                        options={existingNames}
                                        value={person}
                                        onInputChange={(e, newValue) => setPerson(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="ASSIGNED TO"
                                                placeholder="Name"
                                                InputLabelProps={{ shrink: true, sx: { fontWeight: 800, fontSize: '0.65rem' } }}
                                            />
                                        )}
                                    />
                                    <TextField
                                        select label="FREQUENCY" value={freq}
                                        onChange={e => setFreq(e.target.value)}
                                        InputLabelProps={{ shrink: true, sx: { fontSize: '0.65rem' } }}
                                        sx={{ width: '140px' }}
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
                                                }}>{d.charAt(0).toUpperCase()}</Box>
                                        ))}
                                    </Box>
                                )}

                                <Button
                                    variant="contained" fullWidth startIcon={<AddCircle />}
                                    onClick={handleAddChore}
                                    sx={{ bgcolor: 'primary.main', color: 'black', fontWeight: 900, borderRadius: 2 }}
                                >
                                    Add Chore
                                </Button>
                            </Stack>
                        </Paper>

                        {/* CHORE LIST */}
                        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
                            <Stack spacing={1}>
                                {chores.map(c => (
                                    <Paper key={c.id} variant="outlined" sx={{
                                        p: 1.2, display: 'flex', alignItems: 'center', bgcolor: '#0d0d0f', borderColor: '#222',
                                        borderLeft: '3px solid', borderLeftColor: 'primary.main'
                                    }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography sx={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.6, color: 'primary.main' }}>
                                                {c.person.toUpperCase()} • {c.timeEstimate}m • {c.frequency === 'Everyday' ? 'DAILY' : c.customDays.join(', ').toUpperCase()}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="600">{c.name}</Typography>
                                        </Box>
                                        <IconButton size="small" onClick={() => setChores(chores.filter(x => x.id !== c.id))} sx={{ color: '#444' }}><Delete fontSize="inherit" /></IconButton>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>

                        {/* EXPORT AREA - Same as provided before */}
                        <Box sx={{ flexShrink: 0, p: 2, bgcolor: '#141416', borderRadius: 4, border: '1px solid #222' }}>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={2} alignItems="flex-end">
                                    <Box sx={{ flex: 0.5 }}>
                                        <TextField label="NAME" value={exportName} onChange={e => setExportName(e.target.value)} InputLabelProps={{ sx: { fontSize: '0.65rem' } }} />
                                    </Box>
                                    <Box sx={{ flex: 0.5 }}>
                                        <TextField select label="WEEKS" value={weeks} onChange={e => setWeeks(Number(e.target.value))} InputLabelProps={{ sx: { fontSize: '0.65rem' } }}>
                                            {[1, 2, 4, 8].map(w => <MenuItem key={w} value={w}>{w}w</MenuItem>)}
                                        </TextField>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={2} alignItems="flex-end">
                                    <Box sx={{ flex: 1 }}><DatePicker label="START DATE" value={startDate} onChange={setStartDate} slotProps={{ textField: { variant: 'standard', InputLabelProps: { shrink: true, sx: { fontSize: '0.65rem' } } } }} /></Box>
                                    {chores.length > 0 && (
                                        <PDFDownloadLink document={<ChorePDF chores={chores} startDate={dateString} weeks={weeks} />} fileName={`${exportName}-${dateString}.pdf`} style={{ textDecoration: 'none' }}>
                                            {({ loading }) => <Button variant="contained" onClick={recordExport} sx={{ bgcolor: 'white', color: 'black', fontWeight: 'bold', height: 36, px: 3 }}>{loading ? '...' : <Print />}</Button>}
                                        </PDFDownloadLink>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>
                    </Container>
                </Box>
                {/* History Modal remains same */}
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
                            {history.map((item, idx) => (
                                <React.Fragment key={item.id}>
                                    <ListItem disableGutters secondaryAction={
                                        <PDFDownloadLink
                                            document={<ChorePDF chores={item.choresSnapshot} startDate={item.startDate} weeks={item.weeks} />}
                                            fileName={`${item.fileNamePrefix}.pdf`}
                                        >
                                            <IconButton size="small" color="primary"><Download fontSize="small" /></IconButton>
                                        </PDFDownloadLink>
                                    }>
                                        <ListItemText
                                            primary={item.fileNamePrefix}
                                            secondary={`${item.startDate} • ${item.weeks}w`}
                                            primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                                            secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                        />
                                    </ListItem>
                                    {idx < history.length - 1 && <Divider sx={{ borderColor: '#222' }} />}
                                </React.Fragment>
                            ))}
                        </Box>
                        <Button fullWidth sx={{ mt: 2 }} color="inherit" onClick={() => setHistory([])}>Clear History</Button>
                    </Box>
                </Modal>
            </ThemeProvider>
        </LocalizationProvider>
    );
}