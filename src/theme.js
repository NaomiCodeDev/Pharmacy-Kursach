// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // основной цвет (синий)
    },
    secondary: {
      main: '#dc004e', // вторичный цвет (розовый)
    },
    background: {
      default: '#f0f2f5', // цвет фона
    },
  },
});

export default theme;
