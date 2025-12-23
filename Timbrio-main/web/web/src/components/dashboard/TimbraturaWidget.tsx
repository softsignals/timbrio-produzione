import { useState, useEffect } from 'react';
import { Paper, Button, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { AccessTime, PlayArrow, Stop, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { timbratureAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format, isToday, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { Timbratura } from '../../types';

interface TimbraturaWidgetProps {
  onRefresh: () => void;
}

const TimbraturaWidget: React.FC<TimbraturaWidgetProps> = ({ onRefresh }) => {
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentTimbratura, setCurrentTimbratura] = useState<Timbratura | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadTodayTimbratura();
  }, []);

  const loadTodayTimbratura = async () => {
    try {
      const response = await timbratureAPI.getMyTimbrature(1, 10);
      if (response.success && response.data) {
        const today = response.data.find((t) => isToday(parseISO(t.data)));
        if (today) {
          setCurrentTimbratura(today);
        }
      }
    } catch (error) {
      console.error('Errore caricamento timbratura:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTimbra = async (tipo: 'entrata' | 'uscita') => {
    if (!user) return;

    setLoading(true);
    try {
      const response =
        tipo === 'entrata'
          ? await timbratureAPI.timbraEntrata()
          : await timbratureAPI.timbraUscita();

      if (response.success && response.data) {
        setCurrentTimbratura(response.data);
        toast.success(`${tipo === 'entrata' ? 'Entrata' : 'Uscita'} registrata con successo`);
        onRefresh();
        loadTodayTimbratura();
      } else {
        toast.error(response.error || 'Errore durante la timbratura');
      }
    } catch (error) {
      toast.error('Errore durante la timbratura');
    } finally {
      setLoading(false);
    }
  };

  const hasEntrata = !!currentTimbratura?.entrata;
  const hasUscita = !!currentTimbratura?.uscita;
  const oreOggi = currentTimbratura?.oreTotali || 0;

  return (
    <Paper
      sx={{
        p: 3,
        background: mode === 'light'
          ? `linear-gradient(135deg, ${colors.gradients.primary[0]}08 0%, ${colors.gradients.primary[1]}08 100%)`
          : `linear-gradient(135deg, ${colors.gradients.primary[0]}15 0%, ${colors.gradients.primary[1]}15 100%)`,
        border: `1px solid ${mode === 'light' ? `${colors.primary}20` : `${colors.primary}30`}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${colors.gradients.primary[0]}, ${colors.gradients.primary[1]})`,
        },
      }}
      className="fade-in"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Timbratura Rapida
        </Typography>
        {hasEntrata && hasUscita && (
          <Chip
            icon={<CheckCircle />}
            label="Giornata completata"
            color="success"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {loadingData ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          {currentTimbratura && isToday(parseISO(currentTimbratura.data)) ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: mode === 'light' ? 'rgba(37, 99, 235, 0.05)' : 'rgba(59, 130, 246, 0.1)',
                mb: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Timbratura di oggi
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Entrata
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primary }}>
                    {currentTimbratura.entrata}
                  </Typography>
                </Box>
                {currentTimbratura.uscita && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Uscita
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primary }}>
                      {currentTimbratura.uscita}
                    </Typography>
                  </Box>
                )}
                {oreOggi > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ore Totali
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: colors.success }}>
                      {oreOggi.toFixed(1)}h
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: mode === 'light' ? 'rgba(100, 116, 139, 0.05)' : 'rgba(148, 163, 184, 0.1)',
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Nessuna timbratura registrata oggi
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={() => handleTimbra('entrata')}
              disabled={loading || hasEntrata}
              fullWidth
              sx={{
                background: hasEntrata
                  ? undefined
                  : `linear-gradient(135deg, ${colors.gradients.primary[0]}, ${colors.gradients.primary[1]})`,
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: hasEntrata
                  ? undefined
                  : `0 4px 14px 0 ${colors.primary}40`,
                '&:hover': {
                  background: hasEntrata
                    ? undefined
                    : `linear-gradient(135deg, ${colors.gradients.primary[1]}, ${colors.gradients.primary[0]})`,
                  boxShadow: hasEntrata
                    ? undefined
                    : `0 6px 20px 0 ${colors.primary}50`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: mode === 'light' ? '#e2e8f0' : '#334155',
                  color: mode === 'light' ? '#94a3b8' : '#64748b',
                },
              }}
            >
              {hasEntrata ? 'Entrata registrata' : 'Timbra Entrata'}
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Stop />}
              onClick={() => handleTimbra('uscita')}
              disabled={loading || !hasEntrata || hasUscita}
              fullWidth
              sx={{
                background: hasUscita || !hasEntrata
                  ? undefined
                  : `linear-gradient(135deg, ${colors.gradients.secondary[0]}, ${colors.gradients.secondary[1]})`,
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: hasUscita || !hasEntrata
                  ? undefined
                  : `0 4px 14px 0 ${colors.secondary}40`,
                '&:hover': {
                  background: hasUscita || !hasEntrata
                    ? undefined
                    : `linear-gradient(135deg, ${colors.gradients.secondary[1]}, ${colors.gradients.secondary[0]})`,
                  boxShadow: hasUscita || !hasEntrata
                    ? undefined
                    : `0 6px 20px 0 ${colors.secondary}50`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: mode === 'light' ? '#e2e8f0' : '#334155',
                  color: mode === 'light' ? '#94a3b8' : '#64748b',
                },
              }}
            >
              {hasUscita ? 'Uscita registrata' : 'Timbra Uscita'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TimbraturaWidget;

