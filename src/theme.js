// src/theme.js
import { createTheme } from '@mui/material/styles';
import '@fontsource/nunito'; // Импортируем шрифт Nunito

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // насыщенный зеленый (основной)
    },
    secondary: {
      main: '#FFC107', // теплый желтый (акцентный)
    },
    background: {
      default: '#F8F9FA', // светло-серый фон (чистота)
      paper: '#FFFFFF', // фон карточек и элементов
    },
    text: {
      primary: '#212121', // темно-серый для удобочитаемости
      secondary: '#757575', // приглушенный серый
    },
  },
  typography: {
    fontFamily: ['Nunito', 'sans-serif'].join(','),
  },
});

export default theme;
