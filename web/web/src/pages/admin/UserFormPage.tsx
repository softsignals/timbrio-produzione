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
import { usersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { UserRole } from '../../types';

interface UserFormData {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: UserRole;
  badge: string;
  reparto?: string;
  sede?: string;
  telefono?: string;
}

const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      const response = await usersAPI.createUser({
        ...data,
        attivo: true,
      });

      if (response.success) {
        toast.success('Utente creato con successo');
        navigate('/admin/utenti');
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
        Nuovo Utente
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cognome"
                {...register('cognome', { required: 'Cognome obbligatorio' })}
                error={!!errors.cognome}
                helperText={errors.cognome?.message}
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                {...register('password', {
                  required: 'Password obbligatoria',
                  minLength: { value: 6, message: 'Minimo 6 caratteri' },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Ruolo"
                {...register('ruolo', { required: 'Ruolo obbligatorio' })}
                error={!!errors.ruolo}
                helperText={errors.ruolo?.message}
                defaultValue="dipendente"
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reparto"
                {...register('reparto')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sede"
                {...register('sede')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefono"
                {...register('telefono')}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/admin/utenti')}>
                  Annulla
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  Crea Utente
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default UserFormPage;

