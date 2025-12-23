import { Box, Typography, Paper, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { Description, Upload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'react-toastify';

const DocumentiListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Mock data - in produzione verranno dal backend
  const documenti = [
    {
      _id: '1',
      nome: 'Busta Paga Gennaio 2024',
      tipo: 'Busta Paga' as const,
      data: new Date('2024-01-31'),
      nuovo: false,
    },
    {
      _id: '2',
      nome: 'Contratto di Lavoro',
      tipo: 'Contratto' as const,
      data: new Date('2024-01-15'),
      nuovo: true,
    },
  ];

  const isManager = hasRole(['manager', 'admin']);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Documenti</Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => navigate('/documenti/upload')}
          >
            Carica Documento
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {documenti.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Nessun documento disponibile
              </Typography>
            </Paper>
          </Grid>
        ) : (
          documenti.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                    <Description sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    {doc.nuovo && (
                      <Chip label="Nuovo" color="error" size="small" />
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {doc.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {doc.tipo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {format(doc.data, 'dd MMMM yyyy', { locale: it })}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      // Apri documento
                      toast.info('Funzionalità in sviluppo');
                    }}
                  >
                    Visualizza
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default DocumentiListPage;

