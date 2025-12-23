import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { timbratureAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface TimbraturaFormData {
  data: string;
  entrata: string;
  uscita?: string;
  note?: string;
}

const TimbraturaFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<TimbraturaFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: TimbraturaFormData) => {
    setLoading(true);
    try {
      // Per ora, le timbrature manuali vengono create tramite entrata/uscita
      // Questo form può essere usato per modificare timbrature esistenti
      toast.info('Funzionalità in sviluppo');
      navigate('/timbrature');
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nuova Timbratura
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data"
                type="date"
                {...register('data', { required: 'Data obbligatoria' })}
                error={!!errors.data}
                helperText={errors.data?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ora Entrata"
                type="time"
                {...register('entrata', { required: 'Ora entrata obbligatoria' })}
                error={!!errors.entrata}
                helperText={errors.entrata?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ora Uscita"
                type="time"
                {...register('uscita')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={4}
                {...register('note')}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/timbrature')}>
                  Annulla
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  Salva
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TimbraturaFormPage;

