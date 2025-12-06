import React, { useState, type ReactNode } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
  type Theme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  MonetizationOn as PricingIcon,
  BuildCircle as CalibrationIcon,
} from '@mui/icons-material';
import RecallManagement from './components/RecallManagement/RecallManagement';
import AntiCounterfeit from './components/AntiCounterfeit/AntiCounterfeit';
import PricingComparisonDashboard from './components/PricingComparisonDashboard';
import EquipmentCalibrationTracker from './components/EquipmentCalibrationTracker';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  [key: string]: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
      style={{ padding: '24px', display: value === index ? 'block' : 'none' }}
    >
      {children}
    </div>
  );
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Pharmaceutical Blockchain System
            </Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Recall Management & Anti-Counterfeiting
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3 }}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab
                icon={<DashboardIcon />}
                label="Dashboard"
                id="main-tab-0"
                aria-controls="main-tabpanel-0"
              />
              <Tab
                icon={<WarningIcon />}
                label="Recall Management"
                id="main-tab-1"
                aria-controls="main-tabpanel-1"
              />
              <Tab
                icon={<SecurityIcon />}
                label="Anti-Counterfeiting"
                id="main-tab-2"
                aria-controls="main-tabpanel-2"
              />
              <Tab
                icon={<PricingIcon />}
                label="Price Transparency"
                id="main-tab-3"
                aria-controls="main-tabpanel-3"
              />
              <Tab
                icon={<CalibrationIcon />}
                label="Calibrations"
                id="main-tab-4"
                aria-controls="main-tabpanel-4"
              />
            </Tabs>
          </Paper>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h3" gutterBottom>
                Welcome to Pharmaceutical Blockchain System
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Comprehensive Recall Management and Anti-Counterfeiting Solution
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 6 }}>
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => setActiveTab(1)}
                >
                  <WarningIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Recall Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Initiate, track, and manage product recalls with real-time notifications
                  </Typography>
                </Paper>

                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => setActiveTab(2)}
                >
                  <SecurityIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Anti-Counterfeiting
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verify authenticity and report suspicious activities
                  </Typography>
                </Paper>
              </Box>

              <Box sx={{ mt: 6, p: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  System Features
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mt: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🔄 Recall Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Quick recall initiation with severity levels<br/>
                      • Batch search and selection<br/>
                      • Distribution chain tracking<br/>
                      • Real-time stakeholder notifications
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🛡️ Anti-Counterfeiting
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • QR code authenticity verification<br/>
                      • Hologram security checks<br/>
                      • Suspicious activity reporting<br/>
                      • Real-time verification status
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      💰 Price Transparency
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Complete pricing ledger tracking<br/>
                      • Supply chain checkpoints<br/>
                      • Pharmacy price comparisons<br/>
                      • Transparent pricing reports
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      🔧 Equipment Calibration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Equipment registration & QR codes<br/>
                      • Calibration scheduling<br/>
                      • Compliance tracking<br/>
                      • Service provider assignment
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <RecallManagement />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <AntiCounterfeit />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <PricingComparisonDashboard />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <EquipmentCalibrationTracker />
          </TabPanel>
        </Container>
      </div>
    </ThemeProvider>
  );
};

export default App;