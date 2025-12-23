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
import { giustificazioniAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface GiustificazioneFormData {
  data: string;
  tipo: 'mancata_timbratura' | 'ritardo' | 'uscita_anticipata' | 'altro';
  motivazione: string;
}

const GiustificazioniFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<GiustificazioneFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: GiustificazioneFormData) => {
    setLoading(true);
    try {
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      const response = await giustificazioniAPI.creaGiustificazione({
        userId: user._id,
        data: data.data,
        tipo: data.tipo,
        motivazione: data.motivazione,
        stato: 'in_attesa',
      });

      if (response.success) {
        toast.success('Giustificazione creata con successo');
        navigate('/giustificazioni');
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
        Nuova Giustificazione
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
                select
                label="Tipo"
                {...register('tipo', { required: 'Tipo obbligatorio' })}
                error={!!errors.tipo}
                helperText={errors.tipo?.message}
                defaultValue="mancata_timbratura"
              >
                <MenuItem value="mancata_timbratura">Mancata Timbratura</MenuItem>
                <MenuItem value="ritardo">Ritardo</MenuItem>
                <MenuItem value="uscita_anticipata">Uscita Anticipata</MenuItem>
                <MenuItem value="altro">Altro</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivazione"
                multiline
                rows={4}
                {...register('motivazione', {
                  required: 'Motivazione obbligatoria',
                  minLength: { value: 10, message: 'Minimo 10 caratteri' },
                })}
                error={!!errors.motivazione}
                helperText={errors.motivazione?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/giustificazioni')}>
                  Annulla
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  Invia Giustificazione
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default GiustificazioniFormPage;

