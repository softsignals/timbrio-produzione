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
import { ferieAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface FerieFormData {
  tipo: 'ferie' | 'permesso';
  dataInizio: string;
  dataFine: string;
  motivazione?: string;
}

const FerieFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FerieFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FerieFormData) => {
    setLoading(true);
    try {
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      const response = await ferieAPI.creaRichiesta({
        userId: user._id,
        tipo: data.tipo,
        dataInizio: new Date(data.dataInizio),
        dataFine: new Date(data.dataFine),
        giorni: 0, // Verrà calcolato dal backend
        motivazione: data.motivazione,
        stato: 'in_attesa',
        dataRichiesta: new Date(),
      });

      if (response.success) {
        toast.success('Richiesta creata con successo');
        navigate('/ferie');
      } else {
        toast.error(response.error || 'Errore durante la creazione');
      }
    } catch (error) {
      toast.error('Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nuova Richiesta Ferie
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                {...register('tipo', { required: 'Tipo obbligatorio' })}
                error={!!errors.tipo}
                helperText={errors.tipo?.message}
                defaultValue="ferie"
              >
                <MenuItem value="ferie">Ferie</MenuItem>
                <MenuItem value="permesso">Permesso</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Inizio"
                type="date"
                {...register('dataInizio', { required: 'Data inizio obbligatoria' })}
                error={!!errors.dataInizio}
                helperText={errors.dataInizio?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Fine"
                type="date"
                {...register('dataFine', { required: 'Data fine obbligatoria' })}
                error={!!errors.dataFine}
                helperText={errors.dataFine?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivazione"
                multiline
                rows={4}
                {...register('motivazione')}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/ferie')}>
                  Annulla
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  Invia Richiesta
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default FerieFormPage;

