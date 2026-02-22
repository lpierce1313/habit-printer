import Navbar from "./components/Navbar";
import { Box } from "@mui/material";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#0a0a0b' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100dvh', // Dynamic Viewport Height
          overflow: 'hidden' 
        }}>
          {/* Main Content Scroll Area */}
          <Box component="main" sx={{ 
            flex: 1, 
            overflow: 'hidden',
            paddingBottom: '65px', // Exact height of Navbar
            position: 'relative'
          }}>
            {children}
          </Box>
          
          <Navbar />
        </Box>
      </body>
    </html>
  );
}