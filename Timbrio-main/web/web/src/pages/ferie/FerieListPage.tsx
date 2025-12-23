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
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ferieAPI } from '../../services/api';
import { RichiestaFerie } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const FerieListPage: React.FC = () => {
  const [richieste, setRichieste] = useState<RichiestaFerie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    loadRichieste();
  }, []);

  const loadRichieste = async () => {
    setLoading(true);
    try {
      const response = await ferieAPI.getMyRichieste();
      if (response.success && response.data) {
        setRichieste(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle richieste');
    } finally {
      setLoading(false);
    }
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'approvata':
        return 'success';
      case 'rifiutata':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Richieste Ferie</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/ferie/nuova')}
        >
          Nuova Richiesta
        </Button>
        {hasRole(['manager', 'admin']) && (
          <Button
            variant="outlined"
            onClick={() => navigate('/ferie/approvazioni')}
            sx={{ ml: 2 }}
          >
            Approvazioni
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Data Inizio</TableCell>
              <TableCell>Data Fine</TableCell>
              <TableCell>Giorni</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : richieste.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nessuna richiesta trovata
                </TableCell>
              </TableRow>
            ) : (
              richieste.map((richiesta) => (
                <TableRow key={richiesta._id}>
                  <TableCell>{richiesta.tipo === 'ferie' ? 'Ferie' : 'Permesso'}</TableCell>
                  <TableCell>
                    {format(new Date(richiesta.dataInizio), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(richiesta.dataFine), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{richiesta.giorni}</TableCell>
                  <TableCell>
                    <Chip
                      label={richiesta.stato}
                      size="small"
                      color={getStatoColor(richiesta.stato) as any}
                    />
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

export default FerieListPage;

