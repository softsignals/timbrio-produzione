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
  IconButton,
  Chip,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { giustificazioniAPI } from '../../services/api';
import { Giustificazione } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const GiustificazioniApprovalPage: React.FC = () => {
  const [giustificazioni, setGiustificazioni] = useState<Giustificazione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGiustificazioni();
  }, []);

  const loadGiustificazioni = async () => {
    setLoading(true);
    try {
      const response = await giustificazioniAPI.getAllGiustificazioni({ stato: 'in_attesa' });
      if (response.success && response.data) {
        setGiustificazioni(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle giustificazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await giustificazioniAPI.approvaGiustificazione(id);
      if (response.success) {
        toast.success('Giustificazione approvata');
        loadGiustificazioni();
      } else {
        toast.error(response.error || 'Errore durante l\'approvazione');
      }
    } catch (error) {
      toast.error('Errore durante l\'approvazione');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await giustificazioniAPI.rifiutaGiustificazione(id);
      if (response.success) {
        toast.success('Giustificazione rifiutata');
        loadGiustificazioni();
      } else {
        toast.error(response.error || 'Errore durante il rifiuto');
      }
    } catch (error) {
      toast.error('Errore durante il rifiuto');
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      mancata_timbratura: 'Mancata Timbratura',
      ritardo: 'Ritardo',
      uscita_anticipata: 'Uscita Anticipata',
      altro: 'Altro',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Approvazione Giustificazioni
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utente</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Motivazione</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : giustificazioni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nessuna giustificazione in attesa
                </TableCell>
              </TableRow>
            ) : (
              giustificazioni.map((giustificazione) => (
                <TableRow key={giustificazione._id}>
                  <TableCell>{giustificazione.userId}</TableCell>
                  <TableCell>
                    {format(new Date(giustificazione.data), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{getTipoLabel(giustificazione.tipo)}</TableCell>
                  <TableCell>{giustificazione.motivazione}</TableCell>
                  <TableCell>
                    <IconButton
                      color="success"
                      onClick={() => handleApprove(giustificazione._id)}
                    >
                      <Check />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleReject(giustificazione._id)}
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

export default GiustificazioniApprovalPage;

