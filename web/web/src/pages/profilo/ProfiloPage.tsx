import { Box, Typography, Paper, Grid, TextField, Button, Avatar, Chip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const ProfiloPage: React.FC = () => {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  if (!user) {
    return <div>Caricamento...</div>;
  }

  const onSubmit = async (data: any) => {
    // TODO: Implementare aggiornamento profilo
    toast.info('Funzionalità in sviluppo');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profilo Personale
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                bgcolor: 'primary.main',
                fontSize: 48,
              }}
            >
              {user.nome.charAt(0)}{user.cognome.charAt(0)}
            </Avatar>
            <Typography variant="h5" sx={{ mt: 2 }}>
              {user.nome} {user.cognome}
            </Typography>
            <Chip label={user.ruolo} color="primary" sx={{ mt: 1 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome"
              defaultValue={user.nome}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cognome"
              defaultValue={user.cognome}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              defaultValue={user.email}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Badge"
              defaultValue={user.badge}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Reparto"
              defaultValue={user.reparto || '-'}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sede"
              defaultValue={user.sede || '-'}
              disabled
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefono"
              defaultValue={user.telefono || '-'}
              disabled
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProfiloPage;

