import { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress, Grid } from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { timbratureAPI } from '../../services/api';
import { Timbratura } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface MonthlyStatsChartProps {
  userId?: string;
}

const MonthlyStatsChart: React.FC<MonthlyStatsChartProps> = ({ userId }) => {
  const { colors, mode } = useTheme();
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
  }, [userId]);

  const loadMonthlyData = async () => {
    try {
      const response = userId
        ? await timbratureAPI.getAllTimbrature({ userId })
        : await timbratureAPI.getMyTimbrature(1, 200);

      if (response.success && response.data) {
        const timbrature = response.data as Timbratura[];
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Dati per grafico a barre (settimane del mese)
        const weeks: { [key: number]: { ore: number; timbrature: number } } = {};
        monthDays.forEach((day) => {
          const week = Math.ceil(day.getDate() / 7);
          if (!weeks[week]) {
            weeks[week] = { ore: 0, timbrature: 0 };
          }
          const dayTimbrature = timbrature.filter(
            (t) => format(parseISO(t.data), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          weeks[week].ore += dayTimbrature.reduce((sum, t) => sum + (t.oreTotali || 0), 0);
          weeks[week].timbrature += dayTimbrature.length;
        });

        const barChartData = Object.keys(weeks).map((week) => ({
          settimana: `Sett. ${week}`,
          ore: weeks[parseInt(week)].ore,
          timbrature: weeks[parseInt(week)].timbrature,
        }));

        // Dati per grafico a torta (giorni con/senza timbrature)
        const giorniConTimbrature = monthDays.filter((day) => {
          return timbrature.some(
            (t) => format(parseISO(t.data), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
        }).length;

        const pieChartData = [
          { name: 'Giorni lavorati', value: giorniConTimbrature, color: colors.primary },
          {
            name: 'Giorni senza timbrature',
            value: monthDays.length - giorniConTimbrature,
            color: mode === 'light' ? '#e2e8f0' : '#334155',
          },
        ];

        setBarData(barChartData);
        setPieData(pieChartData);
      }
    } catch (error) {
      console.error('Errore caricamento dati mensili:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={350}>
              <CircularProgress />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, minHeight: 400 }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={350}>
              <CircularProgress />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper
          sx={{
            p: 3,
            background: mode === 'light'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: `1px solid ${mode === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(52, 211, 153, 0.2)'}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.gradients.success[0]}, ${colors.gradients.success[1]})`,
            },
          }}
          className="fade-in"
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Ore per Settimana - Mese Corrente
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={mode === 'light' ? '#e2e8f0' : '#334155'} />
              <XAxis
                dataKey="settimana"
                stroke={mode === 'light' ? '#64748b' : '#94a3b8'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={mode === 'light' ? '#64748b' : '#94a3b8'}
                style={{ fontSize: '12px' }}
                label={{ value: 'Ore', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: mode === 'light' ? '#fff' : '#1e293b',
                  border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                  borderRadius: '12px',
                  padding: '12px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Ore']}
              />
              <Legend />
              <Bar
                dataKey="ore"
                fill={colors.success}
                radius={[8, 8, 0, 0]}
                stroke={colors.success}
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 3,
            background: mode === 'light'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)',
            border: `1px solid ${mode === 'light' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(251, 191, 36, 0.2)'}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.gradients.sunset[0]}, ${colors.gradients.sunset[1]})`,
            },
          }}
          className="fade-in"
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Presenze Mese
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: mode === 'light' ? '#fff' : '#1e293b',
                  border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
                  borderRadius: '12px',
                  padding: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MonthlyStatsChart;

