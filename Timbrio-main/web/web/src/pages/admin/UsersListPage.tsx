import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { User } from '../../types';
import { toast } from 'react-toastify';

const UsersListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
      const response = await usersAPI.deleteUser(id);
      if (response.success) {
        toast.success('Utente eliminato con successo');
        loadUsers();
      } else {
        toast.error(response.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const getRuoloColor = (ruolo: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      admin: 'error',
      manager: 'primary',
      dipendente: 'default',
      receptionist: 'info',
    };
    return colors[ruolo] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Utenti</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/utenti/nuovo')}
        >
          Nuovo Utente
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Badge</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Reparto</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nessun utente trovato
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    {user.nome} {user.cognome}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.badge}</TableCell>
                  <TableCell>
                    <Chip label={user.ruolo} size="small" color={getRuoloColor(user.ruolo)} />
                  </TableCell>
                  <TableCell>{user.reparto || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.attivo ? 'Attivo' : 'Disattivo'}
                      size="small"
                      color={user.attivo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/utenti/${user._id}`)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(user._id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UsersListPage;

