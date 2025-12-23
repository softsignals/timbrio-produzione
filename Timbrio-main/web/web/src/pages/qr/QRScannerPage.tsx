import { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { timbratureAPI } from '../../services/api';
import { toast } from 'react-toastify';

const QRScannerPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = 'qr-reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Ignora errori di scansione
        }
      );

      setScanning(true);
    } catch (error) {
      toast.error('Errore nell\'avvio dello scanner');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Errore nello stop dello scanner:', error);
      }
    }
    setScanning(false);
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.type === 'timbrio' && parsed.token) {
        const response = await timbratureAPI.timbraDaQR(parsed.token);
        if (response.success) {
          toast.success('Timbratura registrata con successo');
          setResult('Timbratura registrata con successo');
          stopScanning();
        } else {
          toast.error(response.error || 'Errore durante la timbratura');
          setResult('Errore: ' + (response.error || 'Errore durante la timbratura'));
        }
      } else {
        toast.error('QR code non valido');
        setResult('QR code non valido');
      }
    } catch (error) {
      toast.error('Errore nella lettura del QR code');
      setResult('Errore nella lettura del QR code');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Scanner QR Code
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ mb: 2 }}>
          {!scanning ? (
            <Button variant="contained" onClick={startScanning} fullWidth>
              Avvia Scanner
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={stopScanning} fullWidth>
              Ferma Scanner
            </Button>
          )}
        </Box>

        <div id={qrCodeRegionId} style={{ width: '100%', minHeight: '300px' }} />

        {result && (
          <Alert severity={result.includes('Errore') ? 'error' : 'success'} sx={{ mt: 2 }}>
            {result}
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default QRScannerPage;

