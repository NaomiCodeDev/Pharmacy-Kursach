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
  Collapse,
  Link
} from '@mui/material';
import Papa from 'papaparse';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import '@fontsource/golos-text';

function Clients() {
  const [clients, setClients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    fullName: '',
    birthDate: '',
    phoneNumber: '',
    address: '',
    purchaseHistory: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Ошибка при получении данных: ', error);
      setSnackbar({ open: true, message: 'Ошибка при загрузке данных!', severity: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });
      const data = await response.json();
      setClients([...clients, data]);
      setNewClient({
        fullName: '',
        birthDate: '',
        phoneNumber: '',
        address: '',
        purchaseHistory: ''
      });
      setShowAddForm(false);
      setSnackbar({ open: true, message: 'Клиент успешно добавлен!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при добавлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при добавлении клиента!', severity: 'error' });
    }
  };

  const startEditing = (client) => {
    setEditingId(client.id);
    setEditingClient({ ...client });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingClient(null);
  };

  const saveEditing = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/clients/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingClient),
      });
      const updatedClient = await response.json();
      setClients(clients.map((client) => (client.id === editingId ? updatedClient : client)));
      setEditingId(null);
      setEditingClient(null);
      setSnackbar({ open: true, message: 'Данные клиента успешно обновлены!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при обновлении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при обновлении данных клиента!', severity: 'error' });
    }
  };

  const confirmDeleteClient = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClient = async () => {
    try {
      await fetch(`http://localhost:5000/api/clients/${deleteId}`, {
        method: 'DELETE',
      });
      setClients(clients.filter((client) => client.id !== deleteId));
      setOpenDeleteDialog(false);
      setDeleteId(null);
      setSnackbar({ open: true, message: 'Клиент удалён!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка при удалении: ', error);
      setSnackbar({ open: true, message: 'Ошибка при удалении клиента!', severity: 'error' });
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
            await fetch('http://localhost:5000/api/clients', {
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
        fetchClients();
      },
      error: (error) => {
        console.error('Ошибка при разборе CSV: ', error);
      }
    });
  };

  const exportData = () => {
    const clientsWithoutId = clients.map(({ id, ...rest }) => rest);
    const csv = Papa.unparse(clientsWithoutId, { delimiter: ';' });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'clients.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClients = clients.filter((client) =>
    client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
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
          Клиенты
        </Typography>

        {!showAddForm && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setShowAddForm(true)}
            >
              Добавить нового клиента
            </Button>
          </Box>
        )}

        <Collapse in={showAddForm} timeout="auto" unmountOnExit>
          <Paper elevation={6} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Добавить клиента
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="ФИО клиента"
                  fullWidth
                  value={newClient.fullName}
                  onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Дата рождения"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={newClient.birthDate}
                  onChange={(e) => setNewClient({ ...newClient, birthDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Контактный номер телефона"
                  fullWidth
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient({ ...newClient, phoneNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Адрес"
                  fullWidth
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="История покупок (ссылки на препараты)"
                  fullWidth
                  multiline
                  rows={2}
                  value={newClient.purchaseHistory}
                  onChange={(e) => setNewClient({ ...newClient, purchaseHistory: e.target.value })}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={createClient}
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
              label="Поиск по ФИО"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }} aria-label="clients table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ФИО клиента</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата рождения</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Контактный номер</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Адрес</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>История покупок</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((client) => (
                    <TableRow
                      key={client.id}
                      sx={{
                        transition: 'background-color 0.3s ease',
                        '&:nth-of-type(odd)': { backgroundColor: 'grey.100' },
                        '&:hover': { backgroundColor: 'grey.200' },
                      }}
                    >
                      {editingId === client.id ? (
                        <>
                          <TableCell>
                            <TextField
                              value={editingClient.fullName}
                              onChange={(e) =>
                                setEditingClient({ ...editingClient, fullName: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              value={editingClient.birthDate}
                              onChange={(e) =>
                                setEditingClient({ ...editingClient, birthDate: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={editingClient.phoneNumber}
                              onChange={(e) =>
                                setEditingClient({ ...editingClient, phoneNumber: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={editingClient.address}
                              onChange={(e) =>
                                setEditingClient({ ...editingClient, address: e.target.value })
                              }
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={editingClient.purchaseHistory}
                              onChange={(e) =>
                                setEditingClient({ ...editingClient, purchaseHistory: e.target.value })
                              }
                              variant="standard"
                              multiline
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
                          <TableCell>{client.fullName}</TableCell>
                          <TableCell>{client.birthDate}</TableCell>
                          <TableCell>{client.phoneNumber}</TableCell>
                          <TableCell>{client.address}</TableCell>
                          <TableCell>{client.purchaseHistory}</TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              onClick={() => startEditing(client)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => confirmDeleteClient(client.id)}
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
              count={filteredClients.length}
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
              Вы уверены, что хотите удалить данные этого клиента? Это действие необратимо.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
              Отмена
            </Button>
            <Button onClick={handleDeleteClient} color="error" autoFocus>
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

export default Clients;