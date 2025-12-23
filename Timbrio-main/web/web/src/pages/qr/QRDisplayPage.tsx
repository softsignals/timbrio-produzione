import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Refresh, QrCode } from '@mui/icons-material';
import QRCode from 'qrcode.react';
import { timbratureAPI } from '../../services/api';
import { toast } from 'react-toastify';

const QRDisplayPage: React.FC = () => {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    loadQRToken();
    // Refresh ogni 5 minuti
    const interval = setInterval(() => {
      loadQRToken();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadQRToken = async () => {
    setLoading(true);
    try {
      const response = await timbratureAPI.getQRToken();
      if (response.success && response.data) {
        setQrToken(response.data.token);
        setExpiresAt(new Date(response.data.expiresAt));
      } else {
        toast.error(response.error || 'Errore nel caricamento del QR code');
      }
    } catch (error) {
      toast.error('Errore nel caricamento del QR code');
    } finally {
      setLoading(false);
    }
  };

  const qrData = qrToken
    ? JSON.stringify({
        token: qrToken,
        timestamp: Date.now(),
        type: 'timbrio',
      })
    : '';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">QR Code Timbrature</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadQRToken}
          disabled={loading}
        >
          Aggiorna
        </Button>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
        {loading ? (
          <CircularProgress />
        ) : qrToken ? (
          <>
            <Typography variant="h6" gutterBottom>
              Scansiona questo codice per timbrare
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <QRCode value={qrData} size={300} />
            </Box>
            {expiresAt && (
              <Typography variant="body2" color="text.secondary">
                Scade alle: {expiresAt.toLocaleTimeString('it-IT')}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body1" color="error">
            Errore nel caricamento del QR code
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default QRDisplayPage;

