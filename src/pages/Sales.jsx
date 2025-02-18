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

function Sales() {
  const [sales, setSales] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingSale, setEditingSale] = useState(null);
  const [newSale, setNewSale] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    medicines: [],
    quantities: {},
    totalAmount: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);

  const fetchSales = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sales');
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
      setSnackbar({ open: true, message: 'Ошибка при загрузке данных!', severity: 'error' });
    }
  }, []);

  const fetchMedicines = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/medicines');
      const data = await response.json();
      setAvailableMedicines(data);
    } catch (error) {
      console.error('Ошибка при получении списка препаратов: ', error);
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchMedicines();
  }, [fetchSales, fetchMedicines]);

  const calculateTotalAmount = (medicines, quantities) => {
    return medicines.reduce((total, medicineId) => {
      const medicine = availableMedicines.find(m => m.id === medicineId);
      return total + (medicine?.price || 0) * (quantities[medicineId] || 0);
    }, 0);
  };

  const handleMedicineChange = (event) => {
    const selectedIds = event.target.value;
    setSelectedMedicines(selectedIds);
    setNewSale(prev => ({
      ...prev,
      medicines: selectedIds,
      quantities: selectedIds.reduce((acc, id) => ({
        ...acc,
        [id]: prev.quantities[id] || 1
      }), {})
    }));
  };

  const handleQuantityChange = (medicineId, quantity) => {
    const newQuantities = {
      ...newSale.quantities,
      [medicineId]: Number(quantity)
    };
    setNewSale(prev => ({
      ...prev,
      quantities: newQuantities,
      totalAmount: calculateTotalAmount(prev.medicines, newQuantities)
    }));
  };

  const createSale = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSale),
      });
      const data = await response.json();
      setSales([...sales, data]);
      setNewSale({
        saleDate: new Date().toISOString().split('T')[0],
        medicines: [],
        quantities: {},
        totalAmount: 0
      });
      setSelectedMedicines([]);
      setShowAddForm(false);
      setSnackbar({ open: true, message: 'Продажа успешно добавлена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при добавлении продажи!', severity: 'error' });
    }
  };

  const startEditing = (sale) => {
    setEditingId(sale.id);
    setEditingSale({ ...sale });
    setSelectedMedicines(sale.medicines);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingSale(null);
    setSelectedMedicines([]);
  };

  const saveEditing = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sales/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSale),
      });
      const updatedSale = await response.json();
      setSales(sales.map((sale) => (sale.id === editingId ? updatedSale : sale)));
      setEditingId(null);
      setEditingSale(null);
      setSelectedMedicines([]);
      setSnackbar({ open: true, message: 'Продажа успешно обновлена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при обновлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при обновлении продажи!', severity: 'error' });
    }
  };

  const confirmDeleteSale = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteSale = async () => {
    try {
      await fetch(`http://localhost:5000/api/sales/${deleteId}`, {
        method: 'DELETE',
      });
      setSales(sales.filter((sale) => sale.id !== deleteId));
      setOpenDeleteDialog(false);
      setDeleteId(null);
      setSnackbar({ open: true, message: 'Продажа удалена!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при удалении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при удалении продажи!', severity: 'error' });
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
            await fetch('http://localhost:5000/api/sales', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...item,
                medicines: JSON.parse(item.medicines || '[]'),
                quantities: JSON.parse(item.quantities || '{}'),
                totalAmount: Number(item.totalAmount) || 0
              }),
            });
          } catch (error) {
            console.error('Ошибка при импорте: ', error);
          }
        }
        fetchSales();
      },
      error: (error) => {
        console.error('Ошибка при разборе CSV: ', error);
      }
    });
  };

  const exportData = () => {
    const salesWithStringified = sales.map(sale => ({
      ...sale,
      medicines: JSON.stringify(sale.medicines),
      quantities: JSON.stringify(sale.quantities)
    }));
    const csv = Papa.unparse(salesWithStringified, { delimiter: ';' });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSales = sales.filter((sale) => {
    const searchMatch = sale.id.toString().includes(searchQuery.toLowerCase());
    return searchMatch;
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

  const getMedicineNames = (medicineIds) => {
    return medicineIds
      .map(id => {
        const medicine = availableMedicines.find(m => m.id === id);
        return medicine ? medicine.name : 'Неизвестный препарат';
      })
      .join(', ');
  };

  const getQuantitiesString = (quantities) => {
    return Object.entries(quantities)
      .map(([id, quantity]) => {
        const medicine = availableMedicines.find(m => m.id === parseInt(id));
        return medicine ? `${medicine.name}: ${quantity}` : `Неизвестный препарат: ${quantity}`;
      })
      .join(', ');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: 4, background: 'rgb(245 245 245)', borderRadius: 2, minHeight: '100vh' }}>
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.dark' }}>
          Продажи
        </Typography>

        {!showAddForm && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Добавить новую продажу
            </Button>
          </Box>
        )}

        <Collapse in={showAddForm} timeout="auto" unmountOnExit>
          <Paper elevation={6} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Добавить продажу
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Дата продажи"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={newSale.saleDate}
                  onChange={(e) => setNewSale({ ...newSale, saleDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="medicines-select-label">Препараты</InputLabel>
                  <Select
                    labelId="medicines-select-label"
                    multiple
                    value={selectedMedicines}
                    onChange={handleMedicineChange}
                    label="Препараты"
                  >
                    {availableMedicines.map((medicine) => (
                      <MenuItem key={medicine.id} value={medicine.id}>
                        {medicine.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {selectedMedicines.map((medicineId) => (
                <Grid item xs={12} sm={6} key={medicineId}>
                  <TextField
                    label={`Количество ${availableMedicines.find(m => m.id === medicineId)?.name}`}
                    type="number"
                    fullWidth
                    value={newSale.quantities[medicineId] || ''}
                    onChange={(e) => handleQuantityChange(medicineId, e.target.value)}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Typography variant="h6">
                  Общая стоимость: {calculateTotalAmount(selectedMedicines, newSale.quantities)}
                </Typography>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={createSale}
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
              label="Поиск по номеру продажи"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }} aria-label="sales table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Номер продажи</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата продажи</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Список препаратов</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Количество</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Общая стоимость</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действия </TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((sale) => (
                    <TableRow
                      key={sale.id}
                      sx={{
                        transition: 'background-color 0.3s ease',
                        '&:nth-of-type(odd)': { backgroundColor: 'grey.100' },
                        '&:hover': { backgroundColor: 'grey.200' },
                      }}
                    >
                      {editingId === sale.id ? (
                        <>
                          <TableCell>
                            {sale.id}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              value={editingSale.saleDate}
                              onChange={(e) =>
                                setEditingSale({ ...editingSale, saleDate: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth variant="standard">
                              <Select
                                multiple
                                value={editingSale.medicines}
                                onChange={(e) => {
                                  const newMedicines = e.target.value;
                                  setEditingSale({
                                    ...editingSale,
                                    medicines: newMedicines,
                                    quantities: newMedicines.reduce((acc, id) => ({
                                      ...acc,
                                      [id]: editingSale.quantities[id] || 1
                                    }), {})
                                  });
                                }}
                              >
                                {availableMedicines.map((medicine) => (
                                  <MenuItem key={medicine.id} value={medicine.id}>
                                    {medicine.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {editingSale.medicines.map((medicineId) => (
                                <TextField
                                  key={medicineId}
                                  label={availableMedicines.find(m => m.id === medicineId)?.name}
                                  type="number"
                                  value={editingSale.quantities[medicineId] || ''}
                                  onChange={(e) => {
                                    const newQuantities = {
                                      ...editingSale.quantities,
                                      [medicineId]: Number(e.target.value)
                                    };
                                    setEditingSale({
                                      ...editingSale,
                                      quantities: newQuantities,
                                      totalAmount: calculateTotalAmount(editingSale.medicines, newQuantities)
                                    });
                                  }}
                                  variant="standard"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {calculateTotalAmount(editingSale.medicines, editingSale.quantities)}
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
                          <TableCell>{sale.id}</TableCell>
                          <TableCell>{sale.saleDate}</TableCell>
                          <TableCell>{getMedicineNames(sale.medicines)}</TableCell>
                          <TableCell>{getQuantitiesString(sale.quantities)}</TableCell>
                          <TableCell>{sale.totalAmount}</TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => startEditing(sale)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => confirmDeleteSale(sale.id)}
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
              count={filteredSales.length}
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
              Вы уверены, что хотите удалить эту продажу? Это действие необратимо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Отмена
            </Button>
            <Button onClick={handleDeleteSale} color="error" autoFocus>
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

export default Sales;