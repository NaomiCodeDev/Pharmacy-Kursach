import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Medicines from './pages/Medicines';
// import Clients from './pages/Clients';
// import Recipes from './pages/Recipes';
// import Sales from './pages/Sales';
// import Supplies from './pages/Supplies';
import Logo from './components/Logo';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Box sx={{ flexGrow: 1 }}>
              <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Logo />
              </Link>
            </Box>
            <Button color="inherit" component={Link} to="/medicines">
              Препараты
            </Button>
            <Button color="inherit" component={Link} to="/clients">
              Клиенты
            </Button>
            <Button color="inherit" component={Link} to="/recipes">
              Рецепты
            </Button>
            <Button color="inherit" component={Link} to="/sales">
              Продажи
            </Button>
            <Button color="inherit" component={Link} to="/supplies">
              Поставки
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          <Routes>
            <Route path="/medicines" element={<Medicines />} />
            {/* <Route path="/clients" element={<Clients />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/supplies" element={<Supplies />} /> */}
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;