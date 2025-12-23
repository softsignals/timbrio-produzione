import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, useTheme } from '@mui/material';
import { AccessTime, Description, BeachAccess, Assignment, TrendingUp, CalendarToday } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { timbratureAPI } from '../../services/api';
import { Timbratura } from '../../types';
import StatCard from '../../components/common/StatCard';
import TimbraturaWidget from '../../components/dashboard/TimbraturaWidget';
import RecentActivity from '../../components/dashboard/RecentActivity';
import WeeklyChart from '../../components/dashboard/WeeklyChart';
import MonthlyStatsChart from '../../components/dashboard/MonthlyStatsChart';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, isToday } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { colors, mode } = useCustomTheme();
  const [timbrature, setTimbrature] = useState<Timbratura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimbrature();
  }, []);

  const loadTimbrature = async () => {
    try {
      const response = await timbratureAPI.getMyTimbrature(1, 100);
      if (response.success && response.data) {
        setTimbrature(response.data);
      }
    } catch (error) {
      console.error('Errore caricamento timbrature:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Caricamento...</Typography>
      </Box>
    );
  }

  const isReceptionist = user.ruolo === 'receptionist';

  if (isReceptionist) {
    navigate('/qr/dashboard');
    return null;
  }

  // Calcolo statistiche
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  
  const timbratureSettimana = timbrature.filter((t) =>
    isWithinInterval(parseISO(t.data), { start: weekStart, end: weekEnd })
  );

  const oreSettimana = timbratureSettimana
    .filter((t) => t.oreTotali)
    .reduce((sum, t) => sum + (t.oreTotali || 0), 0);

  const timbratureOggi = timbrature.filter((t) => isToday(parseISO(t.data)));

  const oreMese = timbrature
    .filter((t) => t.oreTotali)
    .reduce((sum, t) => sum + (t.oreTotali || 0), 0);

  const stats = [
    {
      title: 'Ore Lavorate (Settimana)',
      value: `${oreSettimana.toFixed(1)}h`,
      icon: <AccessTime />,
      gradient: 'primary' as const,
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: 'Timbrature Oggi',
      value: timbratureOggi.length,
      icon: <CalendarToday />,
      gradient: 'success' as const,
    },
    {
      title: 'Ore Totali (Mese)',
      value: `${oreMese.toFixed(1)}h`,
      icon: <TrendingUp />,
      gradient: 'ocean' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Timbrature',
      icon: <AccessTime />,
      path: '/timbrature',
      gradient: 'primary' as const,
    },
    {
      title: 'Documenti',
      icon: <Description />,
      path: '/documenti',
      gradient: 'secondary' as const,
    },
    {
      title: 'Ferie',
      icon: <BeachAccess />,
      path: '/ferie',
      gradient: 'emerald' as const,
    },
    {
      title: 'Giustificazioni',
      icon: <Assignment />,
      path: '/giustificazioni',
      gradient: 'sunset' as const,
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${colors.gradients.primary[0]}, ${colors.gradients.primary[1]})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1,
          }}
        >
          Benvenuto, {user.nome}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
          Ecco un riepilogo della tua attività
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Statistiche */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}

        {/* Widget Timbratura */}
        <Grid item xs={12} md={6}>
          <TimbraturaWidget onRefresh={loadTimbrature} />
        </Grid>

        {/* Attività Recenti */}
        <Grid item xs={12} md={6}>
          <RecentActivity timbrature={timbrature} />
        </Grid>

        {/* Grafico Settimanale */}
        <Grid item xs={12}>
          <WeeklyChart />
        </Grid>

        {/* Grafici Mensili */}
        <Grid item xs={12}>
          <MonthlyStatsChart />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: mode === 'light'
                ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(96, 165, 250, 0.05) 100%)',
              border: `1px solid ${mode === 'light' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
            }}
            className="fade-in"
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Azioni Rapide
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => {
                const gradientColors = colors.gradients[action.gradient];
                return (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        background: mode === 'light'
                          ? `linear-gradient(135deg, ${gradientColors[0]}08 0%, ${gradientColors[1]}08 100%)`
                          : `linear-gradient(135deg, ${gradientColors[0]}15 0%, ${gradientColors[1]}15 100%)`,
                        border: `1px solid ${mode === 'light' ? `${gradientColors[0]}20` : `${gradientColors[0]}30`}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px) scale(1.02)',
                          boxShadow: `0 10px 25px -5px ${gradientColors[0]}40`,
                          '&::before': {
                            opacity: 1,
                          },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: `linear-gradient(90deg, ${gradientColors[0]}, ${gradientColors[1]})`,
                          opacity: 0.7,
                          transition: 'opacity 0.3s',
                        },
                      }}
                      onClick={() => navigate(action.path)}
                      className="fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${gradientColors[0]}20, ${gradientColors[1]}20)`,
                            mb: 2,
                          }}
                        >
                          <Box sx={{ color: gradientColors[0], fontSize: 40 }}>{action.icon}</Box>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {action.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

