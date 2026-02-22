"use client";
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Checklist, Groups } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10, borderRadius: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={pathname}
        onChange={(event, newValue) => router.push(newValue)}
        sx={{ bgcolor: '#141416', height: 65, borderTop: '1px solid #222' }}
      >
        <BottomNavigationAction 
          label="Tasks" 
          value="/" 
          icon={<Checklist />} 
          sx={{ color: '#757575', '&.Mui-selected': { color: '#4ade80' } }}
        />
        <BottomNavigationAction 
          label="Chores" 
          value="/chores" 
          icon={<Groups />} 
          sx={{ color: '#757575', '&.Mui-selected': { color: '#4ade80' } }}
        />
      </BottomNavigation>
    </Paper>
  );
}