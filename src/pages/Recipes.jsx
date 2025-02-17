import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TablePagination,
  Container,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse
} from '@mui/material';
import Papa from 'papaparse';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import '@fontsource/golos-text';

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [newRecipe, setNewRecipe] = useState({
    recipeNumber: '',
    issueDate: '',
    patientName: '',
    prescribedMedicines: '',
    expiryDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const fetchRecipes = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
      setSnackbar({ open: true, message: 'Ошибка при загрузке данных!', severity: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const createRecipe = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecipe),
      });
      const data = await response.json();
      setRecipes([...recipes, data]);
      setNewRecipe({
        recipeNumber: '',
        issueDate: '',
        patientName: '',
        prescribedMedicines: '',
        expiryDate: ''
      });
      setShowAddForm(false);
      setSnackbar({ open: true, message: 'Рецепт успешно добавлен!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при добавлении рецепта!', severity: 'error' });
    }
  };

  const startEditing = (recipe) => {
    setEditingId(recipe.id);
    setEditingRecipe({ ...recipe });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingRecipe(null);
  };

  const saveEditing = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recipes/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRecipe),
      });
      const updatedRecipe = await response.json();
      setRecipes(recipes.map((rec) => (rec.id === editingId ? updatedRecipe : rec)));
      setEditingId(null);
      setEditingRecipe(null);
      setSnackbar({ open: true, message: 'Рецепт успешно обновлён!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при обновлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при обновлении рецепта!', severity: 'error' });
    }
  };

  const confirmDeleteRecipe = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteRecipe = async () => {
    try {
      await fetch(`http://localhost:5000/api/recipes/${deleteId}`, {
        method: 'DELETE',
      });
      setRecipes(recipes.filter((rec) => rec.id !== deleteId));
      setOpenDeleteDialog(false);
      setDeleteId(null);
      setSnackbar({ open: true, message: 'Рецепт удалён!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при удалении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при удалении рецепта!', severity: 'error' });
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const importedData = results.data.filter(
          (item) => Object.values(item).some((value) => value !== '' && value != null)
        );

        for (let item of importedData) {
          try {
            await fetch('http://localhost:5000/api/recipes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item),
            });
          } catch (error) {
            console.error('Ошибка при импорте: ', error);
          }
        }
        fetchRecipes();
      },
      error: (error) => {
        console.error('Ошибка при разборе CSV: ', error);
      }
    });
  };

  const exportData = () => {
    const recipesWithoutId = recipes.map(({ id, ...rest }) => rest);
    const csv = Papa.unparse(recipesWithoutId, { delimiter: ';' });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'recipes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecipes = recipes.filter((rec) => 
    rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.recipeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 4, background: 'rgb(245 245 245)', borderRadius: 2, minHeight: '100vh' }}>
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.dark' }}>
          Рецепты
        </Typography>

        {!showAddForm && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Добавить новый рецепт
            </Button>
          </Box>
        )}

        <Collapse in={showAddForm} timeout="auto" unmountOnExit>
          <Paper elevation={6} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Добавить рецепт
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Номер рецепта"
                  fullWidth
                  value={newRecipe.recipeNumber}
                  onChange={(e) => setNewRecipe({ ...newRecipe, recipeNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Дата выписки"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={newRecipe.issueDate}
                  onChange={(e) => setNewRecipe({ ...newRecipe, issueDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="ФИО пациента"
                  fullWidth
                  value={newRecipe.patientName}
                  onChange={(e) => setNewRecipe({ ...newRecipe, patientName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Список назначенных препаратов"
                  fullWidth
                  multiline
                  rows={4}
                  value={newRecipe.prescribedMedicines}
                  onChange={(e) => setNewRecipe({ ...newRecipe, prescribedMedicines: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Срок действия рецепта"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={newRecipe.expiryDate}
                  onChange={(e) => setNewRecipe({ ...newRecipe, expiryDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={createRecipe}
                sx={{ mr: 1 }}
              >
                Добавить
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => setShowAddForm(false)}
              >
                Отмена
              </Button>
            </Box>
          </Paper>
        </Collapse>

        <Paper elevation={6} sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Поиск по номеру рецепта или ФИО пациента"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }} aria-label="recipes table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Номер рецепта</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата выписки</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ФИО пациента</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Список назначенных препаратов</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Срок действия рецепта</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecipes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((recipe) => (
                    <TableRow
                      key={recipe.id}
                      sx={{
                        transition: 'background-color 0.3s ease',
                        '&:nth-of-type(odd)': { backgroundColor: 'grey.100' },
                        '&:hover': { backgroundColor: 'grey.200' },
                      }}
                    >
                      {editingId === recipe.id ? (
                        <>
                          <TableCell>
                            <TextField
                              value={editingRecipe.recipeNumber}
                              onChange={(e) =>
                                setEditingRecipe({ ...editingRecipe, recipeNumber: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={editingRecipe.issueDate}
                              onChange={(e) =>
                                setEditingRecipe({ ...editingRecipe, issueDate: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={editingRecipe.patientName}
                              onChange={(e) =>
                                setEditingRecipe({ ...editingRecipe, patientName: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={editingRecipe.prescribedMedicines}
                              onChange={(e) =>
                                setEditingRecipe({
                                  ...editingRecipe,
                                  prescribedMedicines: e.target.value
                                })
                              }
                              multiline
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={editingRecipe.expiryDate}
                              onChange={(e) =>
                                setEditingRecipe({
                                  ...editingRecipe,
                                  expiryDate: e.target.value
                                })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" onClick={saveEditing} sx={{ mr: 1 }}>
                              <SaveIcon />
                              </IconButton>
                            <IconButton color="secondary" onClick={cancelEditing}>
                              <CancelIcon />
                            </IconButton>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{recipe.recipeNumber}</TableCell>
                          <TableCell>{recipe.issueDate}</TableCell>
                          <TableCell>{recipe.patientName}</TableCell>
                          <TableCell>{recipe.prescribedMedicines}</TableCell>
                          <TableCell>{recipe.expiryDate}</TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => startEditing(recipe)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => confirmDeleteRecipe(recipe.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[8, 16, 24]}
              component="div"
              count={filteredRecipes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Paper>

        <Paper elevation={6} sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" component="h1" align="center" sx={{ mb: 4 }}>
            Импорт / Экспорт данных
          </Typography>
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item>
              <Button variant="outlined" component="label">
                Импорт CSV
                <input type="file" accept=".csv" hidden onChange={importData} />
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={exportData}>
                Экспорт в CSV
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Подтвердите удаление"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Вы уверены, что хотите удалить этот рецепт? Это действие необратимо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Отмена
            </Button>
            <Button onClick={handleDeleteRecipe} color="error" autoFocus>
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default Recipes;