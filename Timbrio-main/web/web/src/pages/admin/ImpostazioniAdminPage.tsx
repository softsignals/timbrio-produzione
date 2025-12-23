import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  FileDownload,
  Description,
} from '@mui/icons-material';
import { timbratureAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ImpostazioniAdminPage: React.FC = () => {
  const [loadingTxt, setLoadingTxt] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);

  const handleExport = async (format: 'txt' | 'csv') => {
    try {
      if (format === 'txt') {
        setLoadingTxt(true);
      } else {
        setLoadingCsv(true);
      }

      const blob = await timbratureAPI.exportTimbrature(format);
      
      // Crea URL temporaneo per il download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Genera nome file con data corrente
      const today = new Date().toISOString().split('T')[0];
      link.download = `timbrature_${today}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Esportazione ${format.toUpperCase()} completata con successo`);
    } catch (error: any) {
      console.error('Errore esportazione:', error);
      toast.error(`Errore durante l'esportazione: ${error.message || 'Errore sconosciuto'}`);
    } finally {
      setLoadingTxt(false);
      setLoadingCsv(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Impostazioni Amministratore
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci le esportazioni dei dati delle timbrature
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Esportazione Dati
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          Esporta tutte le timbrature in formato TXT o CSV. I dati sono ordinati per cognome 
          in ordine alfabetico e includono: codice univoco (badge), data (timestamp), 
          verso (entrata/uscita), e commessa.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'action.hover',
                },
                transition: 'all 0.2s',
              }}
            >
              <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Esporta in TXT
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Formato di testo con separatori tab
              </Typography>
              <Button
                variant="contained"
                startIcon={loadingTxt ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
                onClick={() => handleExport('txt')}
                disabled={loadingTxt || loadingCsv}
                fullWidth
                sx={{ mt: 1 }}
              >
                {loadingTxt ? 'Esportazione in corso...' : 'Scarica TXT'}
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  bgcolor: 'action.hover',
                },
                transition: 'all 0.2s',
              }}
            >
              <Description sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Esporta in CSV
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Formato CSV compatibile con Excel
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={loadingCsv ? <CircularProgress size={20} color="inherit" /> : <FileDownload />}
                onClick={() => handleExport('csv')}
                disabled={loadingTxt || loadingCsv}
                fullWidth
                sx={{ mt: 1 }}
              >
                {loadingCsv ? 'Esportazione in corso...' : 'Scarica CSV'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ImpostazioniAdminPage;
