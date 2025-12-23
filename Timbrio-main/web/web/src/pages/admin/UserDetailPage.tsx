import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { usersAPI } from '../../services/api';
import { User, UserRole } from '../../types';
import { toast } from 'react-toastify';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Partial<User>>();

  useEffect(() => {
    if (id) {
      loadUser(id);
    }
  }, [id]);

  const loadUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await usersAPI.getUserById(userId);
      if (response.success && response.data) {
        setUser(response.data);
        reset(response.data);
      }
    } catch (error) {
      toast.error('Errore nel caricamento dell\'utente');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Partial<User>) => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await usersAPI.updateUser(id, data);
      if (response.success && response.data) {
        setUser(response.data);
        toast.success('Utente aggiornato con successo');
      } else {
        toast.error(response.error || 'Errore durante l\'aggiornamento');
      }
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return <div>Caricamento...</div>;
  }

  if (!user) {
    return <div>Utente non trovato</div>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dettaglio Utente
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                {...register('nome', { required: 'Nome obbligatorio' })}
                error={!!errors.nome}
                helperText={errors.nome?.message}
                defaultValue={user.nome}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cognome"
                {...register('cognome', { required: 'Cognome obbligatorio' })}
                error={!!errors.cognome}
                helperText={errors.cognome?.message}
                defaultValue={user.cognome}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email', {
                  required: 'Email obbligatoria',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Email non valida',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                defaultValue={user.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Ruolo"
                {...register('ruolo')}
                defaultValue={user.ruolo}
              >
                <MenuItem value="dipendente">Dipendente</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Badge"
                {...register('badge', { required: 'Badge obbligatorio' })}
                error={!!errors.badge}
                helperText={errors.badge?.message}
                defaultValue={user.badge}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reparto"
                {...register('reparto')}
                defaultValue={user.reparto}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sede"
                {...register('sede')}
                defaultValue={user.sede}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                {...register('telefono')}
                defaultValue={user.telefono}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body1">Stato:</Typography>
                <Chip
                  label={user.attivo ? 'Attivo' : 'Disattivo'}
                  color={user.attivo ? 'success' : 'default'}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/admin/utenti')}>
                  Annulla
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  Salva Modifiche
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default UserDetailPage;

