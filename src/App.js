import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Box,
  Divider
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

import WelcomePage from './pages/WelcomePage';
import Medicines from './pages/Medicines';
import Clients from './pages/Clients';
import Recipes from './pages/Recipes';
import Sales from './pages/Sales';
import Supplies from './pages/Supplies';
import Logo from './components/Logo';

const drawerWidth = 250;
const activeGreen = '#4CAF50';
const inactiveGray = '#757575';

function Navigation({ menuItems }) {
  const location = useLocation();
  
  return (
    <List>
      {menuItems.map((item) => {
        const isSelected = location.pathname === item.path;
        
        return (
          <ListItem 
            button 
            component={Link} 
            to={item.path} 
            key={item.text}
            selected={isSelected}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'transparent',
                color: activeGreen,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.08)',
                }
              },
              color: inactiveGray,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <ListItemIcon
              sx={{
                color: isSelected ? theme.palette.primary.main : inactiveGray
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? theme.palette.primary.main : inactiveGray
              }}
            />
          </ListItem>
        );
      })}
    </List>
  );
}

function App() {
  const menuItems = [
    { text: 'Препараты', icon: <MedicationIcon />, path: '/medicines' },
    { text: 'Клиенты', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Рецепты', icon: <DescriptionIcon />, path: '/recipes' },
    { text: 'Продажи', icon: <ShoppingCartIcon />, path: '/sales' },
    { text: 'Поставки', icon: <LocalShippingIcon />, path: '/supplies' }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Drawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            variant="permanent"
            anchor="left"
          >
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '64px',
                backgroundColor: theme.palette.primary.main,
                color: 'white'
              }}
            >
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Logo />
              </Link>
            </Box>
            <Divider />
            <Box sx={{ overflow: 'auto' }}>
              <Navigation menuItems={menuItems} />
            </Box>
          </Drawer>

          <Box
            component="main"
            sx={{ 
              flexGrow: 1, 
              p: 3,
              width: `calc(100% - ${drawerWidth}px)`,
            }}
          >
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/supplies" element={<Supplies />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;