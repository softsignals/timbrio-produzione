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
import { timbratureAPI } from '../../services/api';
import { Timbratura } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const TimbratureListPage: React.FC = () => {
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  useEffect(() => {
    loadTimbrature();
  }, []);

  const loadTimbrature = async () => {
    setLoading(true);
    try {
      const response = hasRole(['admin', 'manager'])
        ? await timbratureAPI.getAllTimbrature()
        : await timbratureAPI.getMyTimbrature();
      if (response.success && response.data) {
        setTimbrature(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle timbrature');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa timbratura?')) return;

    try {
      const response = await timbratureAPI.deleteTimbratura(id);
      if (response.success) {
        toast.success('Timbratura eliminata con successo');
        loadTimbrature();
      } else {
        toast.error(response.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Timbrature</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/timbrature/nuova')}
        >
          Nuova Timbratura
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Entrata</TableCell>
              <TableCell>Uscita</TableCell>
              <TableCell>Ore Totali</TableCell>
              <TableCell>Metodo</TableCell>
              <TableCell>Stato</TableCell>
              {hasRole(['admin', 'manager']) && <TableCell>Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : timbrature.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nessuna timbratura trovata
                </TableCell>
              </TableRow>
            ) : (
              timbrature.map((timbratura) => (
                <TableRow key={timbratura._id}>
                  <TableCell>
                    {format(new Date(timbratura.data), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{timbratura.entrata}</TableCell>
                  <TableCell>{timbratura.uscita || '-'}</TableCell>
                  <TableCell>{timbratura.oreTotali?.toFixed(1) || '-'}h</TableCell>
                  <TableCell>
                    <Chip
                      label={timbratura.metodoTimbratura === 'qr' ? 'QR' : 'Manuale'}
                      size="small"
                      color={timbratura.metodoTimbratura === 'qr' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={timbratura.approvata ? 'Approvata' : 'In attesa'}
                      size="small"
                      color={timbratura.approvata ? 'success' : 'warning'}
                    />
                  </TableCell>
                  {hasRole(['admin', 'manager']) && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(timbratura._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TimbratureListPage;

