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
  TablePagination
} from '@mui/material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    form: '',
    dosage: '',
    manufacturer: '',
    expiryDate: '',
    quantity: 0,
    price: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const medicinesCollectionRef = collection(db, 'medicines');

  const fetchMedicines = useCallback(async () => {
    try {
      const data = await getDocs(medicinesCollectionRef);
      const meds = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMedicines(meds);
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
    }
  }, [medicinesCollectionRef]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const createMedicine = async () => {
    try {
      const docRef = await addDoc(medicinesCollectionRef, newMedicine);
      setMedicines([...medicines, { id: docRef.id, ...newMedicine }]);
      setNewMedicine({
        name: '',
        form: '',
        dosage: '',
        manufacturer: '',
        expiryDate: '',
        quantity: 0,
        price: 0
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Ошибка при добавлении: ', error);
    }
  };

  const startEditing = (medicine) => {
    setEditingId(medicine.id);
    setEditingMedicine({ ...medicine });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingMedicine(null);
  };

  const saveEditing = async () => {
    try {
      const medicineDoc = doc(db, 'medicines', editingId);
      const { id, ...updateData } = editingMedicine;
      await updateDoc(medicineDoc, updateData);
      setMedicines(medicines.map((med) => med.id === editingId ? editingMedicine : med));
      setEditingId(null);
      setEditingMedicine(null);
    } catch (error) {
      console.error('Ошибка при обновлении: ', error);
    }
  };

  const confirmDeleteMedicine = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteMedicine = async () => {
    try {
      const medicineDoc = doc(db, 'medicines', deleteId);
      await deleteDoc(medicineDoc);
      setMedicines(medicines.filter((med) => med.id !== deleteId));
      setOpenDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Ошибка при удалении: ', error);
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const importedData = results.data.filter(item =>
          Object.values(item).some(value => value !== "" && value != null)
        );

        for (let item of importedData) {
          item.quantity = Number(item.quantity) || 0;
          item.price = Number(item.price) || 0;
          try {
            await addDoc(medicinesCollectionRef, item);
          } catch (error) {
            console.error('Ошибка при импорте: ', error);
          }
        }
        fetchMedicines();
      },
      error: (error) => {
        console.error('Ошибка при разборе CSV: ', error);
      }
    });
  };

  const exportData = () => {
    const medicinesWithoutId = medicines.map(({ id, ...rest }) => rest);
    const csv = Papa.unparse(medicinesWithoutId, { delimiter: ';' });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'medicines.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f0f2f5' }}>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 4 }}>
        Препараты
      </Typography>

      {!showAddForm && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={() => setShowAddForm(true)}
          >
            Добавить новый препарат
          </Button>
        </Box>
      )}

      {showAddForm && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Добавить препарат
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Название препарата"
                fullWidth
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Форма выпуска"
                fullWidth
                value={newMedicine.form}
                onChange={(e) => setNewMedicine({ ...newMedicine, form: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Дозировка"
                fullWidth
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Производитель"
                fullWidth
                value={newMedicine.manufacturer}
                onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Срок годности"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={newMedicine.expiryDate}
                onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Количество"
                type="number"
                fullWidth
                value={newMedicine.quantity}
                onChange={(e) => setNewMedicine({ ...newMedicine, quantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Цена"
                type="number"
                fullWidth
                value={newMedicine.price}
                onChange={(e) => setNewMedicine({ ...newMedicine, price: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={createMedicine}
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
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Импорт / Экспорт данных
        </Typography>
        <Grid container spacing={2} alignItems="center" justify="center">
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

      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={11}>
            <TextField
              label="Поиск по названию"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, mt: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="medicines table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Название</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Форма выпуска</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дозировка</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Производитель</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Срок годности</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Количество</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Цена</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((med) => (
                  <TableRow
                    key={med.id}
                    sx={{
                      '&:nth-of-type(odd)': { backgroundColor: 'grey.100' },
                      '&:hover': { backgroundColor: 'grey.200' },
                    }}
                  >
                    {editingId === med.id ? (
                      <>
                        <TableCell>
                          <TextField
                            value={editingMedicine.name}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingMedicine.form}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, form: e.target.value })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingMedicine.dosage}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, dosage: e.target.value })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingMedicine.manufacturer}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, manufacturer: e.target.value })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={editingMedicine.expiryDate}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, expiryDate: e.target.value })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={editingMedicine.quantity}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, quantity: Number(e.target.value) })}
                            variant="standard"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={editingMedicine.price}
                            onChange={(e) => setEditingMedicine({ ...editingMedicine, price: Number(e.target.value) })}
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
                        <TableCell>{med.name}</TableCell>
                        <TableCell>{med.form}</TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.manufacturer}</TableCell>
                        <TableCell>{med.expiryDate}</TableCell>
                        <TableCell>{med.quantity}</TableCell>
                        <TableCell>{med.price}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => startEditing(med)} sx={{ mr: 1 }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => confirmDeleteMedicine(med.id)}>
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
            count={filteredMedicines.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
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
            Вы уверены, что хотите удалить этот препарат? Это действие необратимо.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteMedicine} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Medicines;