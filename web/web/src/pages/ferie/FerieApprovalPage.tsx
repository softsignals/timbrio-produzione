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
import { Check, Close } from '@mui/icons-material';
import { ferieAPI } from '../../services/api';
import { RichiestaFerie } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const FerieApprovalPage: React.FC = () => {
  const [richieste, setRichieste] = useState<RichiestaFerie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRichieste();
  }, []);

  const loadRichieste = async () => {
    setLoading(true);
    try {
      const response = await ferieAPI.getAllRichieste({ stato: 'in_attesa' });
      if (response.success && response.data) {
        setRichieste(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle richieste');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await ferieAPI.approvaRichiesta(id);
      if (response.success) {
        toast.success('Richiesta approvata');
        loadRichieste();
      } else {
        toast.error(response.error || 'Errore durante l\'approvazione');
      }
    } catch (error) {
      toast.error('Errore durante l\'approvazione');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await ferieAPI.rifiutaRichiesta(id);
      if (response.success) {
        toast.success('Richiesta rifiutata');
        loadRichieste();
      } else {
        toast.error(response.error || 'Errore durante il rifiuto');
      }
    } catch (error) {
      toast.error('Errore durante il rifiuto');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Approvazione Richieste Ferie
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Data Inizio</TableCell>
              <TableCell>Data Fine</TableCell>
              <TableCell>Giorni</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : richieste.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nessuna richiesta in attesa
                </TableCell>
              </TableRow>
            ) : (
              richieste.map((richiesta) => (
                <TableRow key={richiesta._id}>
                  <TableCell>{richiesta.userId}</TableCell>
                  <TableCell>{richiesta.tipo === 'ferie' ? 'Ferie' : 'Permesso'}</TableCell>
                  <TableCell>
                    {format(new Date(richiesta.dataInizio), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(richiesta.dataFine), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{richiesta.giorni}</TableCell>
                  <TableCell>
                    <IconButton
                      color="success"
                      onClick={() => handleApprove(richiesta._id)}
                    >
                      <Check />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleReject(richiesta._id)}
                    >
                      <Close />
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

export default FerieApprovalPage;

