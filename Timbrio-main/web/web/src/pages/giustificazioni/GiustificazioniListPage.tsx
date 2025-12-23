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
import { giustificazioniAPI } from '../../services/api';
import { Giustificazione } from '../../types';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const GiustificazioniListPage: React.FC = () => {
  const [giustificazioni, setGiustificazioni] = useState<Giustificazione[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    loadGiustificazioni();
  }, []);

  const loadGiustificazioni = async () => {
    setLoading(true);
    try {
      const response = await giustificazioniAPI.getMyGiustificazioni();
      if (response.success && response.data) {
        setGiustificazioni(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento delle giustificazioni');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Giustificazioni</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/giustificazioni/nuova')}
        >
          Nuova Giustificazione
        </Button>
        {hasRole(['manager', 'admin']) && (
          <Button
            variant="outlined"
            onClick={() => navigate('/giustificazioni/approvazioni')}
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
              <TableCell>Data</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Motivazione</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : giustificazioni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nessuna giustificazione trovata
                </TableCell>
              </TableRow>
            ) : (
              giustificazioni.map((giustificazione) => (
                <TableRow key={giustificazione._id}>
                  <TableCell>
                    {format(new Date(giustificazione.data), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>{getTipoLabel(giustificazione.tipo)}</TableCell>
                  <TableCell>{giustificazione.motivazione}</TableCell>
                  <TableCell>
                    <Chip
                      label={giustificazione.stato}
                      size="small"
                      color={getStatoColor(giustificazione.stato) as any}
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

export default GiustificazioniListPage;

