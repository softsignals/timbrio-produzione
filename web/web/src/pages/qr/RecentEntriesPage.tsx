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
  Chip,
} from '@mui/material';
import { timbratureAPI } from '../../services/api';
import { Timbratura } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const RecentEntriesPage: React.FC = () => {
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentEntries();
    const interval = setInterval(() => {
      loadRecentEntries();
    }, 30000); // Refresh ogni 30 secondi

    return () => clearInterval(interval);
  }, []);

  const loadRecentEntries = async () => {
    setLoading(true);
    try {
      const response = await timbratureAPI.getRecentEntries(20);
      if (response.success && response.data) {
        setTimbrature(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle timbrature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Timbrature Recenti
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Ora</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Metodo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : timbrature.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nessuna timbratura recente
                </TableCell>
              </TableRow>
            ) : (
              timbrature.map((timbratura) => (
                <TableRow key={timbratura._id}>
                  <TableCell>
                    {format(new Date(timbratura.data), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>
                    {timbratura.entrata}
                    {timbratura.uscita && ` - ${timbratura.uscita}`}
                  </TableCell>
                  <TableCell>
                    {timbratura.uscita ? 'Uscita' : 'Entrata'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={timbratura.metodoTimbratura === 'qr' ? 'QR' : 'Manuale'}
                      size="small"
                      color={timbratura.metodoTimbratura === 'qr' ? 'primary' : 'default'}
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

export default RecentEntriesPage;

