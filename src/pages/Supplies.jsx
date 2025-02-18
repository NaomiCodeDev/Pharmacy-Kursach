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

function Supplies() {
  const [supplies, setSupplies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingSupply, setEditingSupply] = useState(null);
  const [newSupply, setNewSupply] = useState({
    supplyNumber: '',
    supplyDate: '',
    medicinesList: '',
    quantities: '',
    regularSupplier: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [supplierFilter, setSupplierFilter] = useState('');

  const fetchSupplies = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/supplies');
      const data = await response.json();
      setSupplies(data);
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
      setSnackbar({ open: true, message: 'Ошибка при загрузке данных!', severity: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  const createSupply = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/supplies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSupply),
      });
      const data = await response.json();
      setSupplies([...supplies, data]);
      setNewSupply({
        supplyNumber: '',
        supplyDate: '',
        medicinesList: '',
        quantities: '',
        regularSupplier: ''
      });
      setShowAddForm(false);
      setSnackbar({ open: true, message: 'Поставка успешно добавлена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при добавлении поставки!', severity: 'error' });
    }
  };

  const startEditing = (supply) => {
    setEditingId(supply.id);
    setEditingSupply({ ...supply });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingSupply(null);
  };

  const saveEditing = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/supplies/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSupply),
      });
      const updatedSupply = await response.json();
      setSupplies(supplies.map((sup) => (sup.id === editingId ? updatedSupply : sup)));
      setEditingId(null);
      setEditingSupply(null);
      setSnackbar({ open: true, message: 'Поставка успешно обновлена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при обновлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при обновлении поставки!', severity: 'error' });
    }
  };

  const confirmDeleteSupply = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteSupply = async () => {
    try {
      await fetch(`http://localhost:5000/api/supplies/${deleteId}`, {
        method: 'DELETE',
      });
      setSupplies(supplies.filter((sup) => sup.id !== deleteId));
      setOpenDeleteDialog(false);
      setDeleteId(null);
      setSnackbar({ open: true, message: 'Поставка удалена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при удалении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при удалении поставки!', severity: 'error' });
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
            await fetch('http://localhost:5000/api/supplies', {
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
        fetchSupplies();
      },
      error: (error) => {
        console.error('Ошибка при разборе CSV: ', error);
      }
    });
  };

  const exportData = () => {
    const suppliesWithoutId = supplies.map(({ id, ...rest }) => rest);
    const csv = Papa.unparse(suppliesWithoutId, { delimiter: ';' });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'supplies.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSupplies = supplies.filter((sup) => {
    const searchMatch = sup.supplyNumber.toString().includes(searchQuery.toLowerCase()) ||
                       sup.medicinesList.toLowerCase().includes(searchQuery.toLowerCase());
    const supplierMatch = supplierFilter ? sup.regularSupplier === supplierFilter : true;
    return searchMatch && supplierMatch;
  });

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

  const uniqueSuppliers = [...new Set(supplies.map((sup) => sup.regularSupplier))];

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 4, background: 'rgb(245 245 245)', borderRadius: 2, minHeight: '100vh' }}>
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.dark' }}>
          Поставки
        </Typography>

        {!showAddForm && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Добавить новую поставку
            </Button>
          </Box>
        )}

        <Collapse in={showAddForm} timeout="auto" unmountOnExit>
          <Paper elevation={6} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Добавить поставку
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Номер поставки"
                  fullWidth
                  value={newSupply.supplyNumber}
                  onChange={(e) => setNewSupply({ ...newSupply, supplyNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Дата поставки"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={newSupply.supplyDate}
                  onChange={(e) => setNewSupply({ ...newSupply, supplyDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Список препаратов"
                  fullWidth
                  multiline
                  rows={2}
                  value={newSupply.medicinesList}
                  onChange={(e) => setNewSupply({ ...newSupply, medicinesList: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Количество каждого препарата"
                  fullWidth
                  multiline
                  rows={2}
                  value={newSupply.quantities}
                  onChange={(e) => setNewSupply({ ...newSupply, quantities: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Постоянный поставщик"
                  fullWidth
                  value={newSupply.regularSupplier}
                  onChange={(e) => setNewSupply({ ...newSupply, regularSupplier: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={createSupply}
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
              label="Поиск по номеру поставки или препаратам"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="supplier-filter-label">Постоянный поставщик</InputLabel>
                <Select
                  labelId="supplier-filter-label"
                  id="supplier-filter"
                  value={supplierFilter}
                  label="Постоянный поставщик"
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <MenuItem value="">Все</MenuItem>
                  {uniqueSuppliers.map((supplier) => (
                    <MenuItem key={supplier} value={supplier}>{supplier}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }} aria-label="supplies table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Номер поставки</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата поставки</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Список препаратов</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Количество</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Постоянный поставщик</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSupplies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((sup) => (
                    <TableRow
                      key={sup.id}
                      sx={{
                        transition: 'background-color 0.3s ease',
                        '&:nth-of-type(odd)': { backgroundColor: 'grey.100' },
                        '&:hover': { backgroundColor: 'grey.200' },
                      }}
                    >
                      {editingId === sup.id ? (
                        <>
                          <TableCell>
                            <TextField
                              value={editingSupply.supplyNumber}
                              onChange={(e) =>
                                setEditingSupply({ ...editingSupply, supplyNumber: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              value={editingSupply.supplyDate}
                              onChange={(e) =>
                                setEditingSupply({ ...editingSupply, supplyDate: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              multiline
                              value={editingSupply.medicinesList}
                              onChange={(e) =>
                                setEditingSupply({ ...editingSupply, medicinesList: e.target.value })
                              }
                              variant="standard"
                              />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  multiline
                                  value={editingSupply.quantities}
                                  onChange={(e) =>
                                    setEditingSupply({ ...editingSupply, quantities: e.target.value })
                                  }
                                  variant="standard"
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  value={editingSupply.regularSupplier}
                                  onChange={(e) =>
                                    setEditingSupply({
                                      ...editingSupply,
                                      regularSupplier: e.target.value
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
                              <TableCell>{sup.supplyNumber}</TableCell>
                              <TableCell>{sup.supplyDate}</TableCell>
                              <TableCell>{sup.medicinesList}</TableCell>
                              <TableCell>{sup.quantities}</TableCell>
                              <TableCell>{sup.regularSupplier}</TableCell>
                              <TableCell>
                                <IconButton
                                  color="primary"
                                  onClick={() => startEditing(sup)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={() => confirmDeleteSupply(sup.id)}
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
                  count={filteredSupplies.length}
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
                  Вы уверены, что хотите удалить эту поставку? Это действие необратимо.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                  Отмена
                </Button>
                <Button onClick={handleDeleteSupply} color="error" autoFocus>
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
    
    export default Supplies;